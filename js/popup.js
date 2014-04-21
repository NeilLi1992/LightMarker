
function wrapEntry(entry) {
  var DOM;
  // <div class="menu-item" id="id">Title of the page</div>
  DOM = "<div class='menu-item' id='" + entry.id + "'>" +
        entry.page_title +
        "<i class='icon icon-chevron-right pull-right'></i>" +
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

// 使用runtime.getBackgroundPage来唤醒事件后台页面
chrome.runtime.getBackgroundPage(function(bg){
  window.background = bg;
  generateEntriesView(".menu", background.entries);
});


