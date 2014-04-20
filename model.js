console.log("model.js time " + $.now());

// 全局变量保存所有条目
window.entries = Object();

var model = {
  "size": 0
}

///////////////////////////////////
//数据
///////////////////////////////////
// 获取最新的书签数据，在初始化，已经每次成功保存后会被调用
function updateModel() {
  chrome.storage.local.get(null, function(items) {
    entries = items;
    model.size = Object.keys(entries).length;
  });
}
