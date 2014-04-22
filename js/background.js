// 全局变量message用来捕捉message
window.message = {
  inject_result: undefined
};

function init() {
  //从存储空间读取model,存储到window.entries中
  updateModel();
}

function storageSave(entry, callback) {
  var to_save = Object();
  to_save[entry.id] = entry;
  chrome.storage.local.set(to_save, function(){
    // 注意，此回调函数暂时还不能判断是否成功执行，需要配合runtime.lastError使用
    updateModel(callback);
    alert("书签已保存！");
  });
}

// 保存当前活动标签中的页面
// source表示调用来源
// "click" = 从popup窗口点击保存, 此时要进行新entry的添加
// "shortcut" = 键盘快捷键保存，此时不进行entry的添加
function savePage(source) {
  //注入jquery文件
  chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
    // 编写注入代码, 通过消息传送结果
    var inject_code  = "" +
      "var message = {" +
        "'message_type': 'inject_result'," +
        "'page_title': $('title').text()," +
        "'scroll_pos': $(document).scrollTop()," +
        "'page_height': $(document).height()" +
      "};" +
      "chrome.runtime.sendMessage(message);";

    console.log("Code to inject:" + inject_code);
    //获得scrollTop()数值
    chrome.tabs.executeScript(null, { code: inject_code }, function(result){
      //要在下一层的回调函数中中使用，定义为全局变量
      if (typeof window.message.inject_result != "undefined")
      {
        page_title = window.message.inject_result.page_title;
        scroll_pos = window.message.inject_result.scroll_pos;
        page_height = window.message.inject_result.page_height;
      } else {
        console.log("window.message.inject_result is undefined!");
      }
      //嵌套在外层语句的异步回调函数中，确保上面的已经执行完毕了再执行下面的
      chrome.tabs.getSelected(null, function(tab){
        //内存语句的回调函数，确保两条异步语句都已执行完毕
        var entry = {
          "id": $.now(),
          "time_stamp": $.now(),
          "url": tab.url,
          "page_title": page_title,
          "scroll_pos": scroll_pos,
          "page_height": page_height
        };

        //保存条目
        var remove_prompt = getSize() == 0 ? true : false; //如果之前size=0，现在新加了条目，并且popup是打开的，则要移除提示信息
        storageSave(entry, function(){
          // 如果popup窗口打开的话，发送消息通知popup添加新的条目
          if(!isEmptyObject(chrome.extension.getViews({type: "popup"}))) {
            var message = {
              'message_type': 'append-entry',
              'entry_id': entry.id,
              'remove_prompt': remove_prompt
            };
            chrome.runtime.sendMessage(message);
          }

        });
        console.log("Successfuly saved!");
      });

    });
  });
}

function storageRemove(id, container) {
  chrome.storage.local.remove("" + id, function(){
    console.log("Here! Execution finished!");
    updateModel(function(){
      console.log("Size=" + getSize());
      // 通知popup，没有任何条目了
      if(getSize() == 0 ) {
        console.log("Going to send notification!");
        var message = {
          'message_type': 'list-emptied',
          'container': container
        };
        console.log(message);
        chrome.runtime.sendMessage(message);
      }
    });
  });
}

function load() {

}

// 通过entry获取保存时的数据。通过tabID对Tab注入新的script进行现在内容的分析，获取当前数据
// 从而进一步计算出滚动距离
function getScrollDistance(entry, tabID) {
  return entry.scroll_pos;
}

function openEntry(entry) {
  // 打开参数
  var createProperties = {
    "url": entry.url
  };

  chrome.tabs.create(createProperties, function(tab) {
    // 打开成功，编写执行代码
    var scrollDistance = getScrollDistance(entry, tab.id);
    var inject_code = "window.onload = function(){window.scrollTo(0, " + scrollDistance + ");}";
    chrome.tabs.executeScript(tab.id, { code: inject_code }, function() {});
  });
}

// 注册消息事件监听器
chrome.runtime.onMessage.addListener(function(message){
  if(message.message_type === "inject_result") {
    window.message.inject_result = message;
  } else {
    console.log("Background can't indentify message's type!");
  }
});

chrome.commands.onCommand.addListener(function(command) {
  // 判断command
  switch(command) {
    case "get-pos":
      savePage();
      break;

    case "save-pos":
      console.log("save pos command!");
      break;

    case "debug":
      console.log("debug command!");
      break;
  }
});

// 初始化
init();
