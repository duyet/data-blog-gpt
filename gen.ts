#!/usr/bin/env -S deno run --allow-all

import "https://deno.land/std@0.183.0/dotenv/load.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { slug } from "https://deno.land/x/slug/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const TOPICS = Deno.env.get("TOPICS") || getDefaultTopics();

// Prompt for GPT-3 model
const DEFAULT_PROMPT =
  "Write a Data Engineering blog post as an expert with example code or data flow if possible, in valid Markdown (mdx) format, specific detail about " +
  pickTopic();
const PROMPT = Deno.env.get("PROMPT") || DEFAULT_PROMPT;

const getHeader = ({ category, model, usage, created, id }) =>
  `---
date: ${new Date().toISOString()}
category: ${category}
model: ${model}
usage: ${JSON.stringify(usage)}
created: ${created}
id: ${id}
---

`;

// Main function
async function main() {
  if (!OPENAI_API_KEY) {
    console.error("Please set OPENAI_API_KEY");
    Deno.exit(1);
  }

  const existedFiles = await readDir("./pages");
  console.log("Existed files: ", existedFiles);

  const { response, content } = await generateContent(existedFiles);
  const { title } = await writeContent(response, content);

  if (Deno.env.get("CI") === "true") {
    await writeGithubEnv("TITLE", title);
  }
}

// Read dir recursively
async function readDir(currentPath: string) {
  const files = [];
  for await (const entry of Deno.readDir(currentPath)) {
    if (entry.isDirectory) {
      const subFiles = await readDir(`${currentPath}/${entry.name}`);
      files.push(...subFiles);
    } else if (entry.isFile && entry.name.endsWith(".mdx")) {
      files.push(entry.name.replace(".mdx", ""));
    }
  }
  return files;
}

// Make dir
async function makeDir(path: string) {
  try {
    await Deno.mkdir(path);
    console.log(`Created folder: ${path}`);
  } catch {
    console.log(`Folder existed: ${path}`);
  }
}

// Generate content
async function generateContent(existedFiles: string[]) {
  const openAI = new OpenAI(OPENAI_API_KEY);

  console.log("Requesting OpenAI API to generate the content ...");
  console.log("Prompt:", PROMPT);
  const response = await openAI.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          `You are a expect technical content writer. You are Data Engineer with 50 years of experience. You write blog posts in a very detailed of more than 1500 words in markdown (mdx) format. The content should have image or block code for example. The content can be something like fundamental knowledge to usage of tools. At the end of blog post, add a line about the category or the tool of that post must be in format "Category: [category]". If user do not mention about the topics, please pick a random of these and write about it: ${TOPICS}. The content should not duplicated with the old contents: ${existedFiles}`,
      },
      {
        role: "user",
        content: PROMPT,
      },
    ],
  });
  console.log("OpenAI response", response);

  if (!response.choices) {
    console.error("Response choices");
    Deno.exit(1);
  }

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    console.error("Cannot get content from response");
    Deno.exit(1);
  }
  console.log(`Generated content:\n\n${content}\n`);

  return {
    content,
    response,
  };
}

// Write content to file
async function writeContent(response: Record<string, any>, content: string) {
  // Post title
  const title = content.split("\n")[0].replace(/#/g, "").trim();
  console.log(`Title: ${title}`);

  // Post slug
  const fileSlug = slug(title).replace(":", "");
  console.log(`Slug: ${fileSlug}`);

  // Category at the last line: "Category: [category]"
  let category = "Data Engineering";
  let categorySlug = "data-engineering";

  const lastLine = content.split("\n")[content.split("\n").length - 1];
  const normalizedLastLine = lastLine.replace(/\*/g, "").trim();
  if (normalizedLastLine.startsWith("Category:")) {
    category = normalizedLastLine.replace("Category:", "").trim();
    console.log(`Category provided: ${category}`);

    categorySlug = slug(category);
    console.log(`Category slug: ${categorySlug}`);

    // Create category folder if not existed
    const categoryPath = `./pages/${categorySlug}`;
    await makeDir(categoryPath);

    categorySlug = `${categorySlug}/`;
  }

  const filePath = `./pages/${categorySlug}${fileSlug}.mdx`;

  console.log(`Writing content to ${filePath} ...`);
  const postHeader = getHeader({
    category,
    model: response.model,
    usage: response.usage,
    created: response.created,
    id: response.id,
  });
  await Deno.writeTextFile(filePath, postHeader + content);
  console.log(`File written to ${filePath}`);

  return { filePath, title };
}

async function writeGithubEnv(key: string, value: string) {
  const GITHUB_ENV = Deno.env.get("GITHUB_ENV");
  await Deno.writeTextFile(GITHUB_ENV, `${key}=${value}\n`);
}

function getDefaultTopics(): string[] {
  return [
    "Python",
    "Spark",
    "Hadoop",
    "Kafka",
    "Data Warehouse",
    "HDFS",
    "Scala",
    "ClickHouse",
    "dbt",
    "SQL",
    "BigQuery",
    "PostgreSQL",
    "Kubernetes",
    "Elasticsearch",
    "Big Data",
    "Data Pipelines",
    "Data Lake",
    "Data Integration",
    "Data Transformation",
    "Data Orchestration",
    "Stream Processing",
    "Batch Processing",
    "Real-time Data",
    "Data Governance",
    "Data Modeling",
    "Data Architecture",
    "Data Warehousing",
    "Data Catalog",
    "Data Quality",
    "Data Security",
    "Data Lakes",
    "Data Streaming",
    "Data Engineering",
    "DataOps",
    "ETL",
    "ELT",
    "Data Integration",
    "Data Transformation",
    "Data Pipelines",
    "Data Orchestration",
    "Data Modeling",
    "Data Warehouse",
    "Data Governance",
    "Data Security",
    "Data Catalog",
    "Data Quality",
    "Big Data",
    "Hadoop",
    "Spark",
    "Kafka",
    "Airflow",
    "Stream Processing",
    "Batch Processing",
    "Real-time Data",
    "Data Lake",
    "Data Architecture",
    "Redis",
    "Elasticsearch",
    "Kibana",
    "Tableau",
    "Rust for Data Engineering",
    "Pandas",
    "Polars",
    "Distributed Systems",
    "Distributed Computing",
    "Distributed Databases",
    "Distributed Data Processing",
    "Distributed Data Storage",
    "Distributed Data Pipelines",
    "Databricks",
    "Docker",
    "Apache Mesos",
    "Apache Zookeeper",
    "Apache Kafka",
    "Modern Data Stack",
    "DuckDB",
    "Consensus Algorithms",
    "Distributed Systems",
    "Storage",
    "Replication",
  ];
}

function pickTopic() {
  const topics = getDefaultTopics();
  return topics[Math.floor(Math.random() * topics.length)];
}

await main();
