// 注册消息事件以捕捉消息
chrome.runtime.onMessage.addListener(function(message){
  console.log("Popup gets message!");
  console.log(message);
  if(message.message_type === "list-emptied") {
    generateEmptyView(message.container);
    $("#no-entry").hide().fadeIn(800);
  } else if(message.message_type === "append-entry") {
    // 如果是在empty-list中增加了条目的话，还要移除 a.prompt
    if(message.remove_prompt == true) {
      $("a.prompt").remove();
    }
    appendEntry("ul.list-group", background.entries["" + message.entry_id]);
  } else {
    console.log("Popup can't indentify message's type!");
  }
});

function wrapEntry(entry) {
  var entryDOM = $("<a href='#' class='list-group-item entry'></a>");
  entryDOM.attr("id", entry.id);
  entryDOM.append($("<span class='page-title'></span>").text(entry.page_title));

  //level 0
  entryDOM.append(
    $("<span class='badge open level-0'></span>").append(
      "<i class='icon icon-wrench'></i>"));

  //level 1
  entryDOM.append(
    $("<span class='badge details level-1 hide'></span>").append(
      "<i class='icon icon-list-alt'></i>"));
  entryDOM.append(
    $("<span class='badge edit level-1 hide'></span>").append(
      "<i class='icon icon-pencil'></i>"));
  entryDOM.append(
    $("<span class='badge delete level-1 hide'></span>").append(
      "<i class='icon icon-trash'></i>"));

  //level 2
  entryDOM.append(
    $("<span class='badge confirm level-2 hide'></span>").append(
      "<i class='icon icon-ok'></i>"));
  // entryDOM.append(
  //   $("<span class='badge cancel level-2 hide'></span>").append(
  //     "<i class='icon icon-remove'></i>"));

  return entryDOM;
}

function generateEntriesView(container, entries) {
  // 点击书签按钮进行保存
  $("#bookmark").click(function(){
    background.savePage();
  });

  //若条目为0，则产生空白视图并退出函数
  if(background.getSize() == 0) {
    generateEmptyView(container);
    return;
  }

  //若条目不为空，则将每一条条目append到DOM的最后
  for(id in entries ){
    appendEntry(container, entries[id]);
  }

}

function generateEmptyView(container) {
  var emptyPromptNode = $("<a href='#' class='list-group-item prompt'></a>")
                        .attr("id", "no-entry")
                        .append($("<span class='prompt-text'></span>").text("您目前没有保存书签！点击了解如何保存"))
                        .append("<span class='badge'><i class='icon-arrow-down'></i></span>");

  var howToNode = $("<a href='#' class='list-group-item prompt'></a>")
                      .attr("id", "how-to-save")
                      .append($("<span class='prompt-text'></span>").text("使用快捷键Ctrl+B来保存书签。更多详情"))
                      .append("<span class='badge'><i class='icon-arrow-down'></i></span>")
                      .css("display", "none");

  var detailsNode =  $("<a href='#' class='list-group-item prompt'></a>")
                      .attr("id", "details")
                      .append($("<div class='prompt-text'></div>")
                        .append($("<p></p>").text("光线书签由李泳NeilLi1992开发。"))
                        .append($("<p></p>").text("其最重要的功能是可以保存页面的滑动条位置。后续功能正在开发中。"))
                        .append($("<p></p>").text("联系我：yong.li1992@foxmail.com"))
                        )
                      .css("display", "none");

  $(container).append(emptyPromptNode);

  //注册点击事件
  $("#no-entry").click(function(){
    $(this).unbind("click");
    // 需要时再载入节点
    $(container).append(howToNode);
    $("#how-to-save").fadeIn(700).click(function(){
      $(this).unbind("click");
      // 需要时再载入节点
      $(container).append(detailsNode);
      $(".prompt-text p").css("margin-bottom", "0px");
      $("#details").fadeIn(700);
    });
  });
}

// 向列表底部增加一条新的entry
function appendEntry(container, entry) {
  $(container).append(wrapEntry(entry));
  addEntryListener(container, entry);
}

// 向对应entry增加交互监听器，接受entry对象
function addEntryListener(container, entry) {
 // 增加打开监听
  $("#"+entry.id + " span.page-title").click(function() {
    // 打开目录
    background.openEntry(entry);
  });

  //去除最右边一个icon的margin-right
  $("#" + entry.id + " .level-1").first().css("margin-right", "0px");

  // 鼠标离开该条目时，若箭头已被隐藏，则恢复原样
  $("#" + entry.id).mouseleave(function(){
    $(this).children(".badge").addClass("hide");
    $(this).children(".level-0").removeClass("hide");
    $(this).children(".page-title").css("width", "");
  });


  // 按钮点击逻辑
  $("#" +  entry.id +  " .level-0").click(function(){
    $(this).siblings(".page-title").css("width", "210px");
    $(this).addClass("hide");
    $(this).siblings(".level-1").removeClass("hide");

    //点开以后，添加level-1监听
    $(this).siblings(".delete").click(function(){
      $(this).addClass("hide");
      // 当点击了删除按钮以后在再为其增加监听
      $(this).siblings(".confirm").click(function(){
        // 执行删除该条目，若remove函数中检测到条目数为0的话，会sendMessage
        background.storageRemove($(this).parent().attr("id"), container);

        $(this).css("background-color", "lightgreen");
        $(this).parent().fadeOut(700, function(){
          $(this).remove();

        });
      }).removeClass("hide");
    });
  });

}

// 使用runtime.getBackgroundPage来唤醒事件后台页面
chrome.runtime.getBackgroundPage(function(bg){
  window.background = bg;
  generateEntriesView("ul.list-group", background.entries);

  // 需要等到条目生成以后才能进行的语句，要写在回调函数这下面


});


