var hash=window.location.hash;if(hash.length>0){$("a[href='"+hash+"']").parent().addClass("active");}jQuery(function(a){a(document).ready(function(){a(".navwrapper").stickUp({parts:{0:"home",1:"features",2:"how-to",3:"settings",4:"update",5:"contact"},itemClass:"menuItem",itemHover:"active"});
});});$("#home-icon-img").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){$(this).removeClass("tada");});
$("#home-icon-img").mouseenter(function(){$(this).removeClass("tada");$(this).addClass("shake");}).mouseleave(function(){$(this).removeClass("shake");});
$("#feature-1 img").mouseenter(function(){$(this).addClass("animated pulse");}).mouseleave(function(){$(this).removeClass("animated pulse");});$("#feature-2 img").mouseenter(function(){$(this).addClass("animated pulse");
}).mouseleave(function(){$(this).removeClass("animated pulse");});$("#feature-3 img").mouseenter(function(){$(this).addClass("animated pulse");}).mouseleave(function(){$(this).removeClass("animated pulse");
});function copyToClipboard(d){var c=document.createElement("div");c.contentEditable=true;document.body.appendChild(c);c.innerHTML=d;c.unselectable="off";
var b=window.scrollY;c.focus();window.scrollTo(0,b);document.execCommand("SelectAll");document.execCommand("Copy",false,null);document.body.removeChild(c);
}$("#contact .section-content i").css("cursor","pointer").click(function(){copyToClipboard("yong.li1992@foxmail.com");$(this).removeClass("icon-copy").addClass("icon-ok").css("cursor","default").unbind("click");
});$(window).scroll(function(){if(($(window).height()+$(window).scrollTop())>=$(document).height()){$("#footer-icon img").addClass("animated bounce");$("#footer-icon img").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){$(this).removeClass("animated bounce");
});}else{if(window.scrollY==0){$("#home-icon-img").addClass("tada");$("#home-icon-img").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){$(this).removeClass("tada");
});}}});