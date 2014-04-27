/*
  Background.js在每次浏览器完全关闭后（所有chrome窗口实例），下次重启时都会重新执行一遍，
  空闲一段时间后，下次唤醒时也会重头执行一遍，
  每一次Model的IDB连接也会自动关闭，需要使用Model.init()重建连接
  每次都需要调用init来完成初始化工作
*/

// 当扩展程序第一次安装、更新至新版本或 Chrome 浏览器更新至新版本时产生。
chrome.runtime.onInstalled.addListener(function(){
    console.log("onInstalled事件触发");
    Model.init();
});

// 注册快捷键监听器，分发快捷键命令，注意要确保IDB已打开
chrome.commands.onCommand.addListener(function(command){
  switch(command) {
    case "save-page":
      savePage();
      break;

    default:
  }
});

// 定义一些不涉及控制器核心功能，绝不会被视图直接调用的辅助函数
var helper = {};
// 检查IDB是否已打开
helper.isIDBOpened = function() {
  if(Model.db != null) {
    return true;
  } else {
    return false;
  }
}
// 通过获取entry保存时的数据，通过对tabID注入新的script进行现在内容的分析，进一步算出滚动距离
helper.getScrollDistance = function(entry, tabID) {
  return entry.scrollPos;
}
// 在tabID中调用弹窗
helper.alertMessage = function(options, tabID) {
  switch(options.type) {
    case "page-saved":
      // // 依次注入messenger的相关文件
      // chrome.tabs.insertCSS(tabID, {file: "css/messenger.css"}, function(){
      //   chrome.tabs.insertCSS(tabID, {file: "css/messenger-theme-future.css"}, function(){
      //     chrome.tabs.executeScript(tabID, {file: "js/messenger.min.js"}, function(){
      //       chrome.tabs.executeScript(tabID, {file: "js/messenger-theme-future.js"},function(){
      //         // 注入Messenger执行代码
      //         chrome.tabs.executeScript(tabID, {file: "js/messenger-helper.js"});
      //         // 通知popup关闭
      //         chrome.runtime.sendMessage({message_type: 'close-popup'});
      //       });
      //     });
      //   });
      // });
      // alert("书签保存成功！");
      chrome.tabs.insertCSS(tabID, {file: "css/message_default.css"}, function(){
        chrome.tabs.executeScript(tabID, {file: "js/message.js"}, function(){
          chrome.tabs.executeScript(tabID, {file: "js/message-helper.js"}, function(){

          });
        });
      });

      break;

    default:
      console.log("alerMessage() gets invalid options");
  }
}

/*
  初始化函数，重建IDB的连接
*/
function init() {
  Model.init();
}

// TODO
/*
  需要保存书签时调用。有可能被popup编程触发，也可能接收到快捷键命令触发
  需要加以识别以确定是否要通知popup更新视图，给callback传入参数newEntry
*/
function savePage(callback) {
  // 编写注入代码, 通过消息传送结果
  var injectCode  = "" +
    "result = {" +
      "'pageTitle': document.title," +
      "'scrollPos': document.body.scrollTop," +
      "'pageHeight': document.body.scrollHeight" +
    "};";
  //注入代码，从页面获得相关数值

  // 查询到当前标签页
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs){
    var currentTab = tabs[0];
    // 向获取到的标签页注入代码
    chrome.tabs.executeScript(currentTab.id, {code: injectCode}, function(result){
      if(typeof result === "undefined") {
        console.log("当前页面无法注入！页面不能被保存！");
        alert("当前页面无法进行保存！");
        return;
      }
      if(typeof result[0] === "object") {
        // 构造entry对象
        var newEntry = {
          "timeStamp": new Date().getTime(),
          "url": currentTab.url,
          "pageTitle": result[0].pageTitle,
          "scrollPos": result[0].scrollPos,
          "pageHeight": result[0].pageHeight,
          "listID": null
        };

        // 向IDB保存条目
        addEntry(newEntry, function(){
          // 保存成功后，执行回调函数并传回参数newEntry
          if(callback && typeof callback === "function") {
            callback(newEntry);
          }

          helper.alertMessage({type:"page-saved"}, currentTab.id);
        });

      } else {
        console.log("页面注入结果不是object！");
      }
    });
  });
}


// TODO 始终无法在google搜索结果页面执行成功
/*
  视图中条目被点击时，掉用以打开页面
*/
function openPage(entry, callback) {
  // 打开参数
  var createOptions = {
    "url": entry.url
  };

  chrome.tabs.create(createOptions, function(tab) {
    // 打开成功，编写执行代码
    var scrollDistance = helper.getScrollDistance(entry, tab.id);
    var injectCode = "window.scrollTo(0, " + scrollDistance + ");";
    console.log("注入代码："+injectCode);
    chrome.tabs.executeScript(tab.id, { code: injectCode}, function(){
      if(callback && typeof callback === "function") {
        callback();
      }
    });
  });

}

/*
  添加条目
  @private 由savePage调用
*/
function addEntry(entry, callback) {
  Model.addToStore(entry, "Entries", callback);
}

/*
  获取条目
  @param options: {require: "all" 所有 || "single" 单条 || "search" 搜索 }
  if (require=="single")  use options.timeStamp as key
  在获取成功以后，会给callback传入result参数
*/
function getEntry(options, callback) {
  switch(options.require) {
    case "all":
      Model.getAllFromStore("Entries", callback);
      break;

    case "single":
      Model.getFromStore(options.timeStamp, "Entries", callback);
      break;

    case "search":
      break;

    default:
      console.log("无法识别background getEntry接收的参数！");
      break;
  }
}

// TODO
/*
  更新条目
*/
function updateEntry(entry, callback) {
  Model.putToStore(entry, "Entries", callback);
}

/*
  删除条目
*/
function deleteEntry(timeStamp, callback) {
  // 从IDB中删除
  Model.deleteFromStore(timeStamp, "Entries", callback);
}

/*
  返回条目的数量
*/
function getNumberOfEntries(callback) {
  Model.countStore("Entries", callback);
}

// TODO 列表功能
// function addList() {}
// function getList() {}
// function updateList() {}
// function deleteList() {}

// 每次空闲一段时间后重新唤醒时都要初始化
init();
