const pg = require("pg");
const cron = require("node-cron");

const configuration = require("../Configuration");
const utils = require("../utils/Utils");
const constants = require("../Constants");
const fs = require("fs");

const generateCourseSitemap = (filePath) => {
  const pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port: configuration.getPort(),
    ssl: { rejectUnauthorized: false },
  });

  let sql = `  select id from public.course where sitemap=true`;

  pool.query(sql, [], function (err, result, fields) {
    if (err) {
      console.log(err);
      pool.end(() => {});
    } else {
      const courseStream = fs.createWriteStream(filePath);
      var endOfLine = require("os").EOL;
      const header =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        endOfLine +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
        endOfLine;
      courseStream.write(header);
      for (let i = 0; i < result.rows.length; i++) {
        let id = result.rows[i].id;
        let rowUrl = `https://scuoler.com/courseShowSelected/${id}`;
        let ele =
          ` <url>` +
          endOfLine +
          `  <loc>${rowUrl}</loc>` +
          endOfLine +
          ` </url>` +
          endOfLine;
        //console.log(rowUrl);
        courseStream.write(ele);
      }
      const footer = `</urlset>`;
      courseStream.write(footer);
      courseStream.close();
    }
  });
};

const main = () => {
  generateCourseSitemap(constants.COURSE_SITEMAP_FILE_PATH);
};

//cron.schedule("*/5 * * * *", main);

main();
