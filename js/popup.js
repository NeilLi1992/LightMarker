// 基本容器
window.BASE_CONTAINER = "ul.list-group";

// 注册消息事件以捕捉消息
// chrome.runtime.onMessage.addListener(function(message){
//   switch(message.message_type) {
//     case "list-emptied":
//       generateEmptyView(message.container);
//       $("#no-entry").hide().fadeIn(800);
//       break;

//     case "append-entry":
//       // 如果是在empty-list中增加了条目的话，还要移除 a.prompt
//       if(message.remove_prompt == true) {
//         $("a.prompt").remove();
//       }
//       appendEntry("ul.list-group", background.entries["" + message.entry_id]);
//       break;

//     case "initialized":
//        if($(".prompt").length == 0) {
//         console.log("Going to generate view from message handler!");
//         generateEntriesView("ul.list-group", background.entries);
//        }
//       break;

//     case "close-popup":
//       window.close();
//       break;

//     default:
//       console.log("Popup can't indentify message's type!");
//   }
// });

// 定义一些不涉及视图核心功能，但是有复用价值的函数
var helper = {};
// 将单个entry对象包装成DOM节点，增加按钮等
helper.wrapEntry = function(entry){
  // 创建节点的基本形式
  var node = $("<a href='#' class='list-group-item'></a>");
  node.attr("id", entry.timeStamp);
  node.append($("<span class='page-title' title='" + entry.pageTitle + "'></span>").text(entry.pageTitle));

  // 增加按钮
  // 按钮类的添加格式为 badge + 功能 + 级别 + 效果
  // level-0
  node.append(
    $("<span class='badge open level-0'></span>").append(
      "<i class='icon icon-wrench'></i>"));

  // level-1
  node.append(
    $("<span class='badge details level-1 hide' title='详情'></span>").append(
      "<i class='icon icon-list-alt'></i>"));
  // node.append(
  //   $("<span class='badge edit level-1 hide'></span>").append(
  //     "<i class='icon icon-pencil'></i>"));
  node.append(
    $("<span class='badge delete level-1 hide' title='删除'></span>").append(
      "<i class='icon icon-trash'></i>"));

  //level 2
  node.append(
    $("<span class='badge confirm level-2 hide'></span>").append(
      "<i class='icon icon-ok'></i>"));

  return node;
};
// 在entry被包装为DOM节点，并且已经被append到DOM中之后，
// 增加活动效果，注册监听器
helper.activateEntry = function(entry) {
  // 对于子节点的选择，尽量用精确的selector
  // 选中基本<a>节点，存储为jquery对象
  var baseJqObj = $("#" + entry.timeStamp);

  // 增加打开监听
  baseJqObj.children("span.page-title").click(function(){
    background.openPage(entry);
  });

  // 去除最右边一个icon的margin-right
  baseJqObj.children("span.level-1").first().css("margin-right", "0px");

  // 当鼠标离开该条目时，若箭头已被隐藏，则恢复原样
  baseJqObj.mouseleave(function(){
    $(this).children("span.badge").addClass("hide");
    $(this).children("span.level-0").removeClass("hide");
    $(this).children("span.page-title").css("width", "");
  });

  // 按钮点击逻辑
  baseJqObj.children("span.level-0").click(function(){
    $(this).siblings("span.page-title").css("width", "245px");
    $(this).addClass("hide");
    $(this).siblings("span.level-1").removeClass("hide");

    // 点开以后，添加level-1监听
    // 删除逻辑
    $(this).siblings("span.delete").click(function(){
      $(this).addClass("hide");
      // 当点击了删除按钮以后在再为其增加监听
      $(this).siblings("span.confirm").click(function(){
        console.log("删除确认按钮被点击了！");
        $(this).unbind("click");
        // 执行删除该条目，
        background.deleteEntry(entry.timeStamp, function(){
          background.getNumberOfEntries(function(count){
            // 如果已经没有条目剩下
            if(count == 0) {
              console.log("Count=" + count);
              changeView("allEntries", "empty");
            }
          });
        });
        console.log("执行删除！");
        $(this).css("background-color", "lightgreen");
        $(this).parent().fadeOut(700, function(){
          $(this).remove();
        });
      }).removeClass("hide");
    });
    // 单条视图逻辑
    $(this).siblings("span.details").click(function(){
      $(this).unbind("click");
      changeView("allEntries", "singleEntry", entry);
    });
  });
}
// 将单个entry对象附加到container区域的最后
helper.appendEntry = function(container, entry) {
  // 使用$("#tool-bar").after()可以调整顺序
  $(container).prepend(helper.wrapEntry(entry));
  helper.activateEntry(entry);
}
// 在单条视图中测试每一个数据项的文字溢出
helper.testTextOverflow = function(dataNode, rollSpeed) {
  var dataDiv = dataNode.children("div.data-content");
  var dataSpan = dataDiv.children("span");

  // 判断文字溢出，并且滚动文字
  if(dataSpan.width() > dataDiv.width()) {
    dataNode.append($("<i class='icon-caret-right text-roll'></i>")
                      .mouseenter(function(){
                        $(this).css("font-size", "25px").css("top", "2px");
                        var marginLeftValue = 0;
                        roll = function(){
                          marginLeftValue -= 1;
                          dataSpan.css("margin-left", marginLeftValue + "px");
                          if(dataSpan.width() + marginLeftValue < dataDiv.width()) {
                            window.clearInterval(loop);
                          }
                        }
                        loop = window.setInterval(roll, rollSpeed);
                      }).mouseleave(function(){
                        $(this).css("font-size", "").css("top", "");
                        window.clearInterval(loop);
                        dataSpan.css("margin-left", "");
                      }));
  }
}

/*
  初始化函数，进行popup打开后的初始化操作
  为工具栏条增加响应
*/
function init() {
  if(background.helper.isIDBOpened() == false) {
      // 如果IDB尚未打开，10ms后重试，测试open IDB耗时为2ms内
      console.log("IDB未打开，init 准备重入。");
      // 开启加载提示
      toggleLoadingView(BASE_CONTAINER, "show");
      setTimeout(init, 10);
    } else {
      // 确证IDB已打开
      // 如果已经开启加载提示的话，则关闭
      toggleLoadingView("hide");

      // 增加工具栏响应
      // 点击书签按钮进行保存
      $("#bookmark").click(function(){
        background.savePage(function(){
          window.close();
        });
      }).mouseenter(function(){
        $(this).addClass("animated pulse");
      }).mouseleave(function(){
        $(this).removeClass("animated pulse");
      });

      // 点击齿轮按钮，打开设置页面，关闭popup
      $("#settings").click(function(){
        chrome.tabs.create({url:"settings.html"}, function(){
          window.close();
        });
      }).children("i").mouseenter(function(){
        $(this).addClass("icon-spin");
      }).mouseleave(function(){
        $(this).removeClass("icon-spin");
      });

      // 产生初始的视图，此时无法保证后台IDB已经打开
      background.getNumberOfEntries(function(count){
        if(count != 0) {
          generateAllEntriesView(BASE_CONTAINER);
        } else {
          generateEmptyView(BASE_CONTAINER);
        }
      });
    }
}

/*
  加载提示
*/
function toggleLoadingView(container, display) {
  if(display === "show") {
    if(!document.getElementById("loading")){
      var node = $("<a href='#' class='list-group-item' id='loading'></a>").css("text-align", "center").css("cursor", "default");
      node.append("<span class='prompt-text'><i class='icon-spinner icon-spin'></i>&nbsp&nbsp&nbsp&nbsp加载中...</span>");
      $(container).append(node);
    }
  } else {
    if(document.getElementById("loading")) {
      var child = document.getElementById("loading");
      child.parentNode.removeChild(child);
    }
  }
}

/*
  视图0：无书签提示
*/
function generateEmptyView(container) {
  var emptyPromptNode = $("<a href='#' class='list-group-item prompt'></a>")
                        .css("cursor", "default")
                        .attr("id", "no-entry")
                        .append($("<span class='prompt-text'></span>").text("您目前没有保存书签！点击了解如何保存"))
                        .append("<span class='badge' style='cursor: pointer'><i class='icon-arrow-down'></i></span>");

  var howToNode = $("<a href='#' class='list-group-item prompt'></a>")
                      .css("cursor", "default")
                      .attr("id", "how-to-save")
                      .append($("<span class='prompt-text'></span>").text("使用快捷键Ctrl+B来保存书签。更多详情"))
                      .append("<span class='badge' style='cursor: pointer'><i class='icon-external-link'></i></span>")
                      .css("display", "none");

  $(container).append(emptyPromptNode);
  //注册点击事件
  $("#no-entry .badge").click(function(){
    $(this).unbind("click");
    // 需要时再载入节点
    $(container).append(howToNode);
    $("#how-to-save").fadeIn(700).children(".badge").click(function(){
      chrome.tabs.create({url:"http://neilli1992.github.io/LightMarker/"}, function(){
          window.close();
        });
    });
  });
}

/*
  生成视图1：列出所有书签
*/
function generateAllEntriesView(container, entries) {
  if(!entries) {
      console.log("视图1 开始请求数据");
      background.getEntry({require: "all"}, function(results){
        console.log("IDB数据准备完毕，回调视图1");
        generateAllEntriesView(BASE_CONTAINER, results);
      });
  } else {
    // 保证数据持有。对每一条entry都调用appendEntry以添加到DOM中
    // 由appendEntry负责调用函数以包装节点并增加响应
    console.log("视图1 获得数据");
    for(timeStamp in entries) {
      helper.appendEntry(container, entries[timeStamp]);
    }
  }
}

/*
  生成视图2：单个书签详情视图
*/
function generateSingleEntryView(entry) {
  // 标题节点
  var titleNode = $("<a href='#' class='list-group-item details editable' id='title'></a>");
  titleNode.append($("<span class='data-name'>标题</span>"));
  titleNode.append($("<span class='separator'></span>"));
  titleNode.append($("<div class='data-content'></div>").append($("<span title='" + entry.pageTitle + "'></span>").text(entry.pageTitle)));
  $(BASE_CONTAINER).append(titleNode);
  helper.testTextOverflow(titleNode, 15); //测试标题节点是否溢出

  // 地址节点
  var urlNode = $("<a href='#' class='list-group-item details uneditable' id='url'></a>");
  urlNode.append($("<span class='data-name'>地址</span>"));
  urlNode.append($("<span class='separator'></span>"));
  urlNode.append($("<div class='data-content'></div>").append($("<span title='" + entry.url + "'></span>").text(entry.url)));
  $(BASE_CONTAINER).append(urlNode);
  helper.testTextOverflow(urlNode, 10); //测试地址节点是否溢出

  // 时间节点
  var dateObj = new Date(entry.timeStamp);
  var timeNode = $("<a href='#' class='list-group-item details uneditable' id='time'></a>");
  timeNode.append($("<span class='data-name'>时间</span>"));
  timeNode.append($("<span class='separator'></span>"));
  timeNode.append($("<div class='data-content'></div>").append($("<span></span>").text(dateObj.toLocaleString())));
  $(BASE_CONTAINER).append(timeNode);

  // // 滑动条位置节点
  // var scrollPosNode = $("<a href='#' class='list-group-item details' id='scrollPos'></a>");
  // scrollPosNode.append($("<span class='data-name'>滚动条位置</span>"));
  // scrollPosNode.append($("<span class='separator'></span>"));
  // scrollPosNode.append($("<div class='data-content'></div>").append($("<span></span>").text(entry.scrollPos)));
  // $(BASE_CONTAINER).append(scrollPosNode);

  // 列表节点
  var listNode = $("<a href='#' class='list-group-item details uneditable' id='list'></a>");
  listNode.append($("<span class='data-name'>列表</span>"));
  listNode.append($("<span class='separator'></span>"));
  listNode.append($("<div class='data-content'></div>").append($("<span></span>").text("暂不可用")));
  $(BASE_CONTAINER).append(listNode);

  // 按钮节点
  var buttonsNode = $("<a href='#' class='list-group-item details' id='buttons'></a>");
  buttonsNode.append($("<div><button type='button' class='btn btn-primary' id='edit'><i class='icon-pencil'></i>&nbsp修&nbsp&nbsp改</button></div>"));
  buttonsNode.append($("<div><button type='button' class='btn btn-primary' id='delete'><i class='icon-trash'></i>&nbsp删&nbsp&nbsp除</button></div>"));
  $(BASE_CONTAINER).append(buttonsNode);

  // 按钮逻辑
  // 点击删除
  var clickOnDelete = function() {
    $(this).removeClass("btn-primary").addClass("btn-danger").text(" 确  认").prepend("<i class='icon-ok'></i>");
    $(this).mouseleave(function(){
      $(this).removeClass("btn-danger");
      $(this).addClass("btn-primary");
      $(this).text(" 删 除");
      $(this).prepend("<i class='icon-trash'></i>");
      $(this).unbind("click");
      $(this).click(clickOnDelete);
      $(this).unbind("mouseleave");
    });
    $(this).unbind("click");
    $(this).click(clickOnConfirm);
  }
  // 删除后点击确认
  var clickOnConfirm = function() {
    console.log("即将删除！");
    $(this).unbind("click");
    $(this).unbind("mouseleave");
    // 执行删除该条目，
    background.deleteEntry(entry.timeStamp, function(){
      $("button#delete").removeClass("btn-danger").addClass("btn-success");
      console.log("删除成功！");
      background.getNumberOfEntries(function(count){
        // 如果已经没有条目剩下
        if(count == 0) {
          setTimeout(function(){changeView("singleEntry", "empty");}, 1000);
        } else {
          setTimeout(function(){changeView("singleEntry", "allEntries");}, 1000);
        }
      });
    });
  }
  $("button#delete").click(clickOnDelete);

  // 点击编辑
  var clickOnEdit = function() {
    console.log("Edit!");
    // $(".editable div.data-content").css("border", "1px solid").css("padding-top", "4px").css("padding-bottom", "4px");
    $("a.editable i.text-roll").hide();
    $("a.editable").append("<i class='icon-pencil editing animated fadeInRight'></i>");
    $("a.editable .data-content span").attr("contenteditable", "true")
                                      .css("cursor", "pointer")
                                      .css("display", "inline-block")
                                      .css("width", "265px")
                                      .mouseenter(function(){
                                        $("a.editable i").removeClass("fadeInRight").addClass("swing");
                                      })
                                      .mouseleave(function(){
                                        $("a.editable i").removeClass("swing");
                                      })
                                      .blur(function(){
                                        var text = $(this).text();
                                        if(text.length == 0) {
                                          $("button#edit-save").addClass("disabled");
                                          $(this).parent().siblings("i.editing").addClass("flash")
                                          .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                                            $(this).removeClass("flash");
                                          });

                                        } else {
                                          $("button#edit-save").removeClass("disabled");
                                        }
                                      });

    $("a.uneditable .data-content span").css("cursor", "not-allowed");

    $("a#buttons").children().hide();
    $("a#buttons").prepend($("<div><button type='button' class='btn btn-success' id='edit-save'><i class='icon-ok'></i>&nbsp保&nbsp&nbsp存</button></div>"));
    $("a#buttons").append($("<div><button type='button' class='btn btn-danger' id='edit-cancel'><i class='icon-remove'></i>&nbsp取&nbsp&nbsp消</button></div>"));
    // 点击保存
    $("button#edit-save").click(function(){
      console.log("点击保存！");
      if($("a#title .data-content span").text() !== entry.pageTitle) {
        // 发生了修改，保存到后台IDB中
        entry.pageTitle = $("a#title .data-content span").text();
        background.updateEntry(entry, function(){
          $("button#edit-cancel").click();
        });
      } else {
        // 没有修改，效果等同于取消
        $("button#edit-cancel").click();
      }


    });

    // 点击取消
    $("button#edit-cancel").click(function(){
      $("a.editable i.text-roll").show();
      $("a.editable i.editing").addClass("fadeOutRight")
                                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                                  $(this).remove();
                                });
      $("a.editable .data-content span").removeAttr("contenteditable")
                                        .css("cursor", "")
                                        .css("display", "")
                                        .css("width", "")
                                        .unbind("mouseenter")
                                        .unbind("mouseleave");

      $("a.uneditable .data-content span").css("cursor", "");
      // TODO 不能通用
      // 回复原来的文字
      if($("a#title .data-content span").text() != entry.pageTitle) {
        $("a#title .data-content span").text(entry.pageTitle);
      }

      $("#edit-save, #edit-cancel").parent().remove();
      $("a#buttons").children().show();
    });
  }
  $("button#edit").click(clickOnEdit);
}

// TODO
/*
  生成视图3：列出所有列表
*/
function generateAllListsView() {

}

// TODO
/*
  生成视图4: 列出单个列表中的所有书签
*/
function generateSingleListView() {

}

// TODO
/*
  生成视图5：列出搜索结果书签
*/
function generateSearchResultView() {

}

// TODO
/*
  视图切换函数
*/
function changeView(before, after, entry) {
  if(before == "empty" && after == "allEntries") {
    // 空白——》全部条目：添加书签后os大小=1

  } else if(before == "allEntries" && after == "empty") {
    // 全部条目——》空白：删除书签至大小=0
    console.log("产生空白视图");
    generateEmptyView(BASE_CONTAINER);
  } else if(before == "allEntries" && after == "singleEntry") {
    console.log("产生单条视图");
    // 清空原来的视图*
    $(BASE_CONTAINER).children().remove();
    // 为工具条最左侧增加返回按钮
    // 构造jq对象
    var leftArrow = $("<span class='badge animated' id='back' title='返回'><i class='icon-arrow-left'></i></span>")
                .css("position", "fixed")
                .css("left", "6px")
                .css("top", "3px")
                .mouseenter(function(){
                  $(this).addClass("tada");
                })
                .mouseleave(function(){
                  $(this).removeClass("tada");
                })
                .click(function(){
                  // 点击时切换回全部条目视图
                  changeView("singleEntry", "allEntries");
                })
                .fadeIn("slow");
    $("#tool-bar").prepend(leftArrow);

    if(entry) {
      generateSingleEntryView(entry);
    }
  } else if(before == "singleEntry" && after == "allEntries"){
    // 单条——》全部
    // 先移除单条视图
    $(BASE_CONTAINER).children().fadeOut(function(){
      $(this).remove();
    });
    // 移除返回箭头
    $("span#back").fadeOut(function(){
      $(this).remove();
    });
    generateAllEntriesView(BASE_CONTAINER);
  } else if(before == "singleEntry" && after == "empty") {
    // 单条——》空白
    // 先移除单条视图
    $(BASE_CONTAINER).children().fadeOut(function(){$(this).remove();});
    // 移除返回箭头
    $("span#back").fadeOut("slow", function(){
      $(this).remove();
    });
    generateEmptyView(BASE_CONTAINER);
  }
}

// 唤醒后台，获取后台控制对象，调用init函数
chrome.runtime.getBackgroundPage(function(bg){
  window.background = bg;
  init();
});
