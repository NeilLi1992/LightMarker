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
  node.append($("<span class='page-title'></span>").text(entry.pageTitle));

  // 增加按钮
  // 按钮类的添加格式为 badge + 功能 + 级别 + 效果
  // level-0
  node.append(
    $("<span class='badge open level-0'></span>").append(
      "<i class='icon icon-wrench'></i>"));

  // level-1
  node.append(
    $("<span class='badge details level-1 hide'></span>").append(
      "<i class='icon icon-list-alt'></i>"));
  // node.append(
  //   $("<span class='badge edit level-1 hide'></span>").append(
  //     "<i class='icon icon-pencil'></i>"));
  node.append(
    $("<span class='badge delete level-1 hide'></span>").append(
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

    //点开以后，添加level-1监听
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
  });
}
// 将单个entry对象附加到container区域的最后
helper.appendEntry = function(container, entry) {
  // 使用$("#tool-bar").after()可以调整顺序
  $(container).prepend(helper.wrapEntry(entry));
  helper.activateEntry(entry);
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
        chrome.tabs.create({url:"details.html#settings"}, function(){
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
      chrome.tabs.create({url:"details.html"}, function(){
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
  生成视图2：单个标签详情视图
*/
function generateSingleEntryView() {

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
function changeView(before, after) {
  if(before == "empty" && after == "allEntries") {
    // 空白——》全部条目：添加书签后os大小=1

  } else if(before == "allEntries" && after == "empty") {
    // 全部条目——》空白：删除书签至大小=0
    console.log("产生空白视图");
    generateEmptyView(BASE_CONTAINER);
  }
}

// 唤醒后台，获取后台控制对象，调用init函数
chrome.runtime.getBackgroundPage(function(bg){
  window.background = bg;
  init();
});
