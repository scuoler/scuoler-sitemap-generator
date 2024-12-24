"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg = require("pg");
const configuration = require("../Configuration");
const constants = require("../Constants");
const fs = require("fs");
require("dotenv").config();
const getPool = () => {
    const pool = new pg.Pool({
        host: configuration.getHost(),
        user: configuration.getUserId(),
        password: configuration.getPassword(),
        database: configuration.getDatabase(),
        port: configuration.getPort(),
        ssl: { rejectUnauthorized: false },
    });
    return pool;
};
const writeHeader = (stream, endOfLine) => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>` +
        endOfLine +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
        endOfLine;
    stream.write(header);
};
const writeFooter = (stream) => {
    const footer = `</urlset>`;
    stream.write(footer);
};
const generateCourseSitemap = (filePath) => {
    const pool = getPool();
    let sql = `  select id from public.course where sitemap=true`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const courseStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(courseStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let id = result.rows[i].id;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/courseShowSelected/${id}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                courseStream.write(ele);
            }
            writeFooter(courseStream);
            courseStream.close();
        }
    });
};
const generateQuizSitemap = (filePath) => {
    const pool = getPool();
    let sql = `  select id from public.quiz where sitemap=true`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const quizStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(quizStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let id = result.rows[i].id;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/quizShowSelected/${id}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                quizStream.write(ele);
            }
            writeFooter(quizStream);
            quizStream.close();
        }
    });
};
const writeProblemQueryResultToStream = (problemStream, result, endOfLine) => {
    for (let i = 0; i < result.rows.length; i++) {
        let id = result.rows[i].id;
        let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/problemShowSelected/${id}`;
        let ele = ` <url>` +
            endOfLine +
            `  <loc>${rowUrl}</loc>` +
            endOfLine +
            ` </url>` +
            endOfLine;
        //console.log(rowUrl);
        problemStream.write(ele);
    }
};
const generateProblemSitemapOld = (filePath) => {
    let pool = getPool();
    /* sitemap files are restricted to have 50000 entries, we are
    hence limiting to 40000 */
    let sql1 = `  select id from public.problem 
          where sitemap=true and create_timestamp < $1 
          order by id 
          limit $2 `;
    pool.query(sql1, [constants.PROBLEM_SITEMAP_CUTOFF_DATE, constants.SITEMAP_FILE_MAX_LENGTH], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const sitemapFileNameNoExt = filePath.substring(0, filePath.indexOf(".xml"));
            const filePath1 = sitemapFileNameNoExt + "Old1.xml";
            const problemStream = fs.createWriteStream(filePath1);
            const endOfLine = require("os").EOL;
            writeHeader(problemStream, endOfLine);
            writeProblemQueryResultToStream(problemStream, result, endOfLine);
            writeFooter(problemStream);
            problemStream.close();
        }
    });
    pool = getPool();
    /* Note the additional offset at the end */
    let sql2 = `  select id from public.problem 
            where sitemap=true and create_timestamp < $1 
            order by id 
            limit $2 
            offset $3 `;
    pool.query(sql2, [constants.PROBLEM_SITEMAP_CUTOFF_DATE, constants.SITEMAP_FILE_MAX_LENGTH, constants.SITEMAP_FILE_MAX_LENGTH], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const sitemapFileNameNoExt = filePath.substring(0, filePath.indexOf(".xml"));
            const filePath2 = sitemapFileNameNoExt + "Old2.xml";
            const problemStream = fs.createWriteStream(filePath2);
            const endOfLine = require("os").EOL;
            writeHeader(problemStream, endOfLine);
            writeProblemQueryResultToStream(problemStream, result, endOfLine);
            writeFooter(problemStream);
            problemStream.close();
        }
    });
};
const generateProblemSitemap = (filePath) => {
    const pool = getPool();
    let sql = `  select id from public.problem where sitemap=true and create_timestamp >= $1 `;
    pool.query(sql, [constants.PROBLEM_SITEMAP_CUTOFF_DATE], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const problemStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(problemStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let id = result.rows[i].id;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/problemShowSelected/${id}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                problemStream.write(ele);
            }
            writeFooter(problemStream);
            problemStream.close();
        }
    });
};
const generateUserSitemap = (filePath) => {
    const pool = getPool();
    let sql = ` select id from public.Customer where sitemap=true and deleted=false`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const userStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(userStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let id = result.rows[i].id;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/userShowSelected/${id}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                userStream.write(ele);
            }
            writeFooter(userStream);
            userStream.close();
        }
    });
};
const generateModuleSitemap = (filePath) => {
    const pool = getPool();
    let sql = `select path_url from public.modules_for_sitemap_get_all()`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const moduleStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(moduleStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let path_url = result.rows[i].path_url;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/moduleShowSelected/${path_url}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                moduleStream.write(ele);
            }
            writeFooter(moduleStream);
            moduleStream.close();
        }
    });
};
const generateLessonSitemap = (filePath) => {
    const pool = getPool();
    let sql = `select path_url from public.lessons_for_sitemap_get_all()`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const lessonStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(lessonStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let path_url = result.rows[i].path_url;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/lessonShowSelected/${path_url}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                lessonStream.write(ele);
            }
            writeFooter(lessonStream);
            lessonStream.close();
        }
    });
};
const generatePageSitemap = (filePath) => {
    const pool = getPool();
    let sql = `select path_url from public.pages_for_sitemap_get_all()`;
    pool.query(sql, [], function (err, result) {
        pool.end(() => { });
        if (err) {
            console.log(err);
        }
        else {
            const pageStream = fs.createWriteStream(filePath);
            const endOfLine = require("os").EOL;
            writeHeader(pageStream, endOfLine);
            for (let i = 0; i < result.rows.length; i++) {
                let path_url = result.rows[i].path_url;
                let rowUrl = `https://${constants.LETSENCRYPT_DOMAIN_NAME}/pageShowSelected/${path_url}`;
                let ele = ` <url>` +
                    endOfLine +
                    `  <loc>${rowUrl}</loc>` +
                    endOfLine +
                    ` </url>` +
                    endOfLine;
                //console.log(rowUrl);
                pageStream.write(ele);
            }
            writeFooter(pageStream);
            pageStream.close();
        }
    });
};
const main = () => {
    /*generateUserSitemap(constants.USER_SITEMAP_FILE_PATH);
    generateCourseSitemap(constants.COURSE_SITEMAP_FILE_PATH);
    generateQuizSitemap(constants.QUIZ_SITEMAP_FILE_PATH);
    generateModuleSitemap(constants.MODULE_SITEMAP_FILE_PATH);
    generateLessonSitemap(constants.LESSON_SITEMAP_FILE_PATH);
    generatePageSitemap(constants.PAGE_SITEMAP_FILE_PATH);*/
    generateProblemSitemap(constants.PROBLEM_SITEMAP_FILE_PATH);
    if (process.env.PROBLEM_SITEMAP_OLD === "true") {
        generateProblemSitemapOld(constants.PROBLEM_SITEMAP_FILE_PATH);
    }
};
//cron.schedule("*/5 * * * *", main);
main();
