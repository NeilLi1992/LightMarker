// 全局变量保存所有条目
window.entries = Object();

///////////////////////////////////
//数据
///////////////////////////////////
// 获取最新的书签数据，在初始化，已经每次成功保存后会被调用
function updateModel(callback) {
  chrome.storage.local.get(null, function(items) {
    entries = items;

    // 如果有回调函数的话执行回调函数
    if(typeof(callback) === "function") {
      callback();
    }
  });
}

function getSize() {
  return Object.keys(entries).length;
}
