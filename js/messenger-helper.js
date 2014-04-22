// 本文件由background.js 在alertMessage()函数中被注入标签页以执行

Messenger.options = {
    extraClasses: 'messenger-fixed messenger-on-top',
    theme: 'future'
}

// 消息参数
var options = {
  message: "书签已经成功保存！",
  showCloseButton: true,
  // 3秒后自动隐藏
  hideAfter: 3
};

Messenger().post(options);
