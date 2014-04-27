// var entry = {
//   "timeStamp": 1234567,
//   "url": "http://www.google.com",
//   "page_title": "google search",
//   "scroll_pos": 568,
//   "page_height": 999,
//   "list_id": null
// }

// 创建命名空间
var Model = {};
// 表示数据库，在open成功后被赋值
Model.db = null;

/*
  初始化方法
*/
Model.init = function(callback) {
  var version = 1;
  var upgrade = function() {
    Model.createObjectStore("Entries", "timeStamp");
    Model.createObjectStore("Lists", "id");
  }

  Model.open(version, upgrade, callback);
}

Model.isIDBSupported = function() {
  if("indexedDB" in window) {
    return true;
  } else {
    return false;
  }
}

// TODO Model描述函数
Model.toString = function() {
  return "Model.toString 方法待实现";
}

/*
  应用只使用单一数据库"LightMarker"
*/
Model.open = function(version, upgrade, callback) {
  var openRequest = indexedDB.open("LightMarker", version);

  // 第一次打开数据库，或者版本需要更新
  openRequest.onupgradeneeded = function(e) {
    Model.db = e.target.result;
    //IDB版本提升，执行更新函数
    upgrade();
  }

  // 打开成功
  openRequest.onsuccess = function(e) {
    Model.db = e.target.result;
    if(callback && typeof callback === "function") {
      callback();
    }
  }

  // 打开失败
  openRequest.onerror = function(e) {
    console.log("IDB open error!");
    console.log(e);
  }
}

/*
  创建对象仓库 object store， 相当于数据库的表格
*/
Model.createObjectStore = function(osName, key) {
  if(Model.db != null) {
    if(!Model.db.objectStoreNames.contains(osName)) {
      if(key !== undefined) {
        Model.db.createObjectStore(osName, {keyPath: key});
      } else {
        Model.db.createObjectStore(osName);
      }
    } else {  console.log("Object store 创建失败，指定的os已存在。"); }
  } else {  console.log("IDB尚未打开，Model.db对象为null。");  }
}

/*
  向指定的os添加数据
*/
Model.addToStore = function(obj, osName, callback) {
  if(Model.db != null) {
    // 创建事务对象，指定os与读写模式
    // 事务提交成功后，从事务对象获取要操作的os对象
    var t = Model.db.transaction([osName], "readwrite");
    t.oncomplete = function() {
      console.log("添加数据成功！");
      if(callback && typeof callback === "function") {
        callback();
      }
    }

    var store = t.objectStore(osName);
    var request = store.add(obj);

    // request.onerror = function(e) { console.log("添加数据失败 ", e.target.error.name);}
    // request.onsuccess = function(e) {}

    // TODO transaction方法可以有三个事件来定义回调函数：onabort, oncomplete, onerror

  } else {  console.log("添加数据失败，IDB尚未打开，Model.db对象为null。");  }
}

/*
  按键值从指定的os获取单条数据，对回调函数传入结果
*/
Model.getFromStore = function(key, osName, callback) {
  if(Model.db != null) {
    // 创建事务对象，指定os与只读模式
    var t = Model.db.transaction([osName], "readonly");
    var store = t.objectStore(osName);

    var obj = store.get(key);

    // TODO 暂时未知obj是什么格式
    obj.onerror = function(e) { console.log("获取数据失败 ", e.target.error.name);}
    obj.onsuccess = function(e) {
      if(e.target.result === undefined) {
        console.log("未能获取数据，数据可能不存在。");
      } else {
        console.log("获取数据成功！");
        if(callback && typeof callback === "function") {
          callback(e.target.result);
        }
      }
    }

    // TODO transaction方法可以有三个事件来定义回调函数：onabort, oncomplete, onerror

  } else {  console.log("获取数据失败，IDB尚未打开，Model.db对象为null。");  }
}

/*
    从指定的os获取全部数据, 对于回调函数，总是传入resObj作为结果
*/
Model.getAllFromStore = function(osName, callback) {
  if(Model.db != null) {
    var t = Model.db.transaction([osName], "readonly");
    var store = t.objectStore(osName);

    var cursor = store.openCursor();
    var resObj = {};
    cursor.onsuccess = function(e) {
      var res = e.target.result;
      if(res) {
        resObj[res.key] = res.value;
        res['continue']();
      } else {
        // 已经完成全部数据的获取，存储在resObj中
        console.log("获取全部数据成功！");
        if(callback && typeof callback === "function") {
          callback(resObj);
        }
      }
    }
  } else {  console.log("获取全部数据失败，IDB尚未打开，Model.db对象为null。");  }
}

// TODO
/*
  向指定的os更新一个数据
*/
Model.putToStore = function(obj, osName, callback) {
 if(Model.db != null) {
    // 创建事务对象，指定os与读写模式
    // 事务提交成功后，从事务对象获取要操作的os对象
    var t = Model.db.transaction([osName], "readwrite");
    t.oncomplete = function() {
      console.log("更新数据成功！");
      if(callback && typeof callback === "function") {
        callback();
      }
    }

    var store = t.objectStore(osName);
    var request = store.put(obj);

    // request.onerror = function(e) { console.log("添加数据失败 ", e.target.error.name);}
    // request.onsuccess = function(e) {}

    // TODO transaction方法可以有三个事件来定义回调函数：onabort, oncomplete, onerror

  } else {  console.log("更新数据失败，IDB尚未打开，Model.db对象为null。");  }
}

/*
  从指定的os按键值删除一个数据
  注意，如果要完全确保一个事务已经完成，并且其已经对DB造成影响
  应该注册transaction的oncomplete方法！
  该问题对readwrite型的事务尤其重要
*/
Model.deleteFromStore = function(key, osName, callback) {
  if(Model.db != null) {
    // 创建事务对象，指定os与只读模式
    var t = Model.db.transaction([osName], "readwrite");

    t.oncomplete = function() {
      if(callback && typeof callback === "function") {
        callback();
      }
    }
    // 提交具体操作的请求，但是请求提交成功不代表事务已经完成
    var request = t.objectStore(osName)['delete'](key);
    // request.onerror = function(e) { console.log("删除数据失败 ", e.target.error.name);}
    // request.onsuccess = function(e) { }
  } else {  console.log("删除数据失败，IDB尚未打开，Model.db对象为null。");  }
}

/*
  返回指定os的数据个数
*/
Model.countStore = function(osName, callback) {
  if(Model.db != null) {
    if(Model.db.objectStoreNames.contains(osName)) {
      var t = Model.db.transaction([osName], "readonly");
      var store = t.objectStore(osName);
      var keyRange = IDBKeyRange.lowerBound(0);
      var cursorRequest = store.openCursor(keyRange);
      var size = 0;
      cursorRequest.onsuccess = function(e) {
        var result = e.target.result;
        if(result) {
          size = size + 1;
          result['continue']();
        } else {
          if(callback && typeof callback === "function") {
             callback(size);
          }
        }
      }
    } else {  console.log("获取object store数据个数失败，指定的os不存在。");  }
  } else {  console.log("获取object store数据个数失败，IDB尚未打开，Model.db对象为null。");  }
}

// TODO 复用delete方法来实现clear
/*
  清空指定的os
*/
Model.clearStore = function(osName, callback) {
  if(Model.db != null) {
    if(Model.db.objectStoreNames.contains(osName)) {
      var t = Model.db.transaction([osName], "readwrite");
      t.oncomplete = function(){
        console.log("Object store " + osName + "已被清空");
        if(callback && typeof callback === "function") {
          callback();
        }
      }

      var store = t.objectStore(osName);
      var keyRange = IDBKeyRange.lowerBound(0);
      // 将keyRange指定的所有数据全部删除
      var request = store['delete'](keyRange);

    } else {  console.log("清空os失败，指定的os不存在。");  }
  } else {  console.log("清空os失败，IDB尚未打开，Model.db对象为null。");  }
}
