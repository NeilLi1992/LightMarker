
function wrapEntry(entry) {
  var entryDOM = $("<a href='#' class='list-group-item'></a>");
  entryDOM.attr("id", entry.id);
  entryDOM.append($("<span class='page-title'></span>").text(entry.page_title));

  //level 0
  entryDOM.append(
    $("<span class='badge open level-0'></span>").append(
      "<i class='icon icon-chevron-right'></i>"));

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
  //生成基本的列表
  for(id in entries ){
    $(container).append(wrapEntry(entries[id]));

    // 为每一个条目div添加click事件监听
    $("#"+id + " span.page-title").click(function() {
      // 打开目录
      background.openEntry(entries[$(this).parent().attr("id")]);
      console.log("span is clicked!");
    });
  }

  ///////////////////////////////
  //为列表添加JS效果
  ///////////////////////////////

  // 列表按钮控制区交互逻辑

  // 点开右侧箭头，隐藏箭头，展开按钮
  $(".level-0").click(function(){
    $(this).siblings(".page-title").css("width", "218px");
    $(this).addClass("hide");
    $(this).siblings(".level-1").removeClass("hide");
  });

  // 鼠标离开该条目时，若箭头已被隐藏，则恢复原样
  // 待添加span.page-title的宽度变化
  $(".list-group-item").mouseleave(function(){
    $(this).children(".badge").addClass("hide");
    $(this).children(".level-0").removeClass("hide");
    $(this).children(".page-title").css("width", "");
  });

  // 为删除按钮增加点击监听
  $(".delete").click(function(){
    $(this).addClass("hide");
    // 当点击了删除按钮以后在再为其增加监听
    $(this).siblings(".confirm").click(function(){
      // 执行删除该条目
      alert("删除！");
    }).removeClass("hide");
    // $(this).siblings(".cancel").removeClass("hide");
    // $(this).siblings(".page-title").css("width", "185px");
  });

}

// 使用runtime.getBackgroundPage来唤醒事件后台页面

chrome.runtime.getBackgroundPage(function(bg){
  window.background = bg;
  generateEntriesView("ul.list-group", background.entries);

  // 需要等到条目生成以后才能进行的语句，要写在回调函数这下面


});


