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
        3: 'settings',
        4: 'update',
        5: 'contact'
      },
      itemClass: 'menuItem',
      itemHover: 'active'
    });
  });
});

// 设置联系我中的复制Email
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
