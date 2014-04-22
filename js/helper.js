// 辅助函数文件

// 判断空对象
function isEmptyObject(obj) {
  for(var name in obj) {
    return false;
  }
  return true;
}

// 获取对象中的键值对的个数
function objectSize(obj) {
  return Object.keys(entries).length;
}
