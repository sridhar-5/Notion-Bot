module.exports = function arrangeSentences(content) {
  // paragraph char count < 2000
  var blocks = [];
  var paragraph = "";
  var sentences = content.split(".");
  sentences.forEach((sentence) => {
    if (paragraph.length + sentence.length < 2000) {
      paragraph += sentence;
    } else {
      blocks.push(paragraph);
      paragraph = sentence;
    }
  });
  if (blocks.length == 0 && paragraph.length < 2000) {
    blocks.push(paragraph);
  }
  return blocks;
};
