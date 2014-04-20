// 获取后台页面，通过background变量调用后天函数与变量
var background = chrome.extension.getBackgroundPage();

function wrapEntry(entry) {
  var DOM;
  // <div class="menu-item" id="id">Title of the page</div>
  DOM = "<div class='menu-item' id='" + entry.id + "'>" +
        entry.page_title +
        "</div>";

  return DOM;
}

function generateEntriesView(container, entries) {
  //添加条目div到DOM中
  var container_area = $(container);
  for(id in entries ){
    $(container).append(wrapEntry(entries[id]));

    // 为每一个条目div添加click事件监听
    $("#"+id).click(function() {
      // 打开目录
      background.openEntry(entries[$(this).attr("id")]);
    });
  }

  //添加鼠标悬浮经过时的选中效果
  $(".menu-item").mouseenter(function(){
    $(this).addClass("hover-effect");
  }).mouseleave(function(){
    $(this).removeClass("hover-effect");
  });
}

generateEntriesView(".menu", background.entries);
