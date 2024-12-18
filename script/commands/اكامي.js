const axios = require("axios");
const fs = require("fs");
const gtts = require("gtts");
const path = require("path");

module.exports.config = {
  name: "كامي",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Arjhil",
  description: "بارد مطور من الذكاء الاصطناعي مع بعض الإمتيازات الإجابة على بار جلب الصور ثم قراءة الصور و الأصوات",
  usePrefix: false,
  commandCategory: "الذكاء الإصطناعي",
  usages: "<نص>",
  cooldowns: 5,
};

async function convertImageToText(imageURL) {
  try {
    const response = await axios.get(`https://bard-ai.arjhilbard.repl.co/api/other/img2text?input=${encodeURIComponent(imageURL)}`);
    return response.data.extractedText;
  } catch (error) {
    console.error("خطأ في تحويل الصورة إلى نص:", error);
    return null;
  }
}

function formatFont(text) {
  const fontMapping = {
    a: "a", b: "b", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
    n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
    A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
    N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹",
  };

  let formattedText = "";
  for (const char of text) {
    if (char in fontMapping) {
      formattedText += fontMapping[char];
    } else {
      formattedText += char;
    }
  }
  return formattedText;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply, body } = event;
  let question = "";

  if (type === "message_reply" && messageReply.attachments[0]?.type === "photo") {
    const attachment = messageReply.attachments[0];
    const imageURL = attachment.url;
    question = await convertImageToText(imageURL);

    if (!question) {
      api.sendMessage("❌ فشل تحويل الصورة إلى نص. يرجى المحاولة مرة أخرى بصورة أوضح.", threadID, messageID);
      return;
    }
  } else {
    question = args.join(" ").trim();

    if (!question) {
      api.sendMessage("يرجى تقديم سؤال أو استفسار", threadID, messageID);
      return;
    }
  }

  api.sendMessage("🔎 چۚــٰا̍ڕې ̨ا̍ڸــبــحۡــٽ ̨؏ــنۨ إڇۚــٰا̍بــة،ــٰا̍ڵــمۭــڕچۚــۄۥ ا̍ﻹنۨــٿــڟــٰٱ̍ڔ.....", threadID, messageID);

  try {

    const bardResponse = await axios.get(`https://bard-ai.arjhilbard.repl.co/bard?ask=${encodeURIComponent(question)}`);
    const bardData = bardResponse.data;
    const bardMessage = bardData.message;


    const pinterestResponse = await axios.get(`https://api-all-1.arjhilbard.repl.co/pinterest?search=${encodeURIComponent(question)}`);
    const pinterestImageUrls = pinterestResponse.data.data.slice(0, 6);

    const pinterestImageAttachments = [];



    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    for (let i = 0; i < pinterestImageUrls.length; i++) {
      const imageUrl = pinterestImageUrls[i];
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const imagePath = path.join(cacheDir, `pinterest_image${i + 1}.jpg`);
        fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, "binary"));
        pinterestImageAttachments.push(fs.createReadStream(imagePath));
      } catch (error) {
        console.error("حدث خطأ أثناء جلب صورة من بانتريست:", error);
      }
    }

    const formattedBardAnswer = `📝 ڔٻۧــمۘ ${formatFont(bardMessage)}`;
    api.sendMessage(formattedBardAnswer, threadID);


    const gttsPath = path.join(cacheDir, 'voice.mp3');
    const gttsInstance = new gtts(bardMessage, 'ar');
    gttsInstance.save(gttsPath, function (error, result) {
      if (error) {
        console.error("حدث خطأ أثناء حفظ GTTS:", error);
      } else {

        api.sendMessage({
          body: "🗣️ ּا̍ﻹڃۚــٰٱ̍بــۃ ا̍ڷــڝــﯟٺــﯧْۧــۃ:",
          attachment: fs.createReadStream(gttsPath)
        }, threadID);
      }
    });


    if (pinterestImageAttachments.length > 0) {
      api.sendMessage(
        {
          attachment: pinterestImageAttachments,
          body: `📷 ۛ ּنۨــٿــٰٱ̍ئــڇۚ ּا̍ڶــبــحۡــٽ ۛ ּﻋــنۨ ا̍ڸــڝــﯜڔ ּل: ${question}  `,
        },
        threadID
      );
    }
  } catch (error) {
    console.error("حدث خطأ:", error);
    api.sendMessage("❌ حدث خطأ أثناء معالجة الطلب.", threadID, messageID);
  }
};