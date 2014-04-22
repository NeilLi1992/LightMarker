// 辅助函数文件
function isEmptyObject(obj) {
  for(var name in obj) {
    return false;
  }
  return true;
}
