// window.vartop = 502;

var hash = window.location.hash;
if(hash.length > 0) {
  $("a[href='" + hash + "']").parent().addClass("active");
}

jQuery(function($) {
  $(document).ready( function() {
    //enabling stickUp on the '.navbar-wrapper' class
    $('.navwrapper').stickUp({
      parts: {
        0:'home',
        1:'features',
        2: 'how-to',
        // 3: 'settings',
        3: 'update',
        4: 'contact'
      },
      itemClass: 'menuItem',
      itemHover: 'active'
    });
  });
});

// 为首页的图片增加动画
$("#home-icon-img").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
  $(this).removeClass("tada");
});

$("#home-icon-img").mouseenter(function(){
  $(this).removeClass("tada");
  $(this).addClass("shake");
}).mouseleave(function(){
  $(this).removeClass("shake");
});

// 为特性中的三个图片增加动画
$("#feature-1 img").mouseenter(function(){
  $(this).addClass("animated pulse");
}).mouseleave(function(){
  $(this).removeClass("animated pulse");
});

$("#feature-2 img").mouseenter(function(){
  $(this).addClass("animated pulse");
}).mouseleave(function(){
  $(this).removeClass("animated pulse");
});

$("#feature-3 img").mouseenter(function(){
  $(this).addClass("animated pulse");
}).mouseleave(function(){
  $(this).removeClass("animated pulse");
});

// 设置剪贴板
function copyToClipboard( text ){
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    var a = window.scrollY;
    copyDiv.focus();
    window.scrollTo(0, a);
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}

$("#contact .section-content i").css("cursor", "pointer").click(function(){
  copyToClipboard("yong.li1992@foxmail.com");
  $(this).removeClass("icon-copy").addClass("icon-ok").css("cursor", "default").unbind("click");
});

// 当滚动到最底下时对最底下的图片使用动画
$(window).scroll(function(){
  // 判断滚动到底部
  if(($(window).height() + $(window).scrollTop() ) >= $(document).height()) {
    $("#footer-icon img").addClass("animated bounce");
    // 当动画结束时，去除类
    $("#footer-icon img").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
      $(this).removeClass("animated bounce");
    });
  } else if(window.scrollY == 0) {
    $("#home-icon-img").addClass("tada");
    $("#home-icon-img").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
      $(this).removeClass("tada");
    });
  }
});
