#!/usr/bin/env -S deno run --allow-all

import "https://deno.land/std@0.183.0/dotenv/load.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { slug } from "https://deno.land/x/slug/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const TOPICS = Deno.env.get("TOPICS") || getDefaultTopics();
const CATEGORIES = Deno.env.get("CATEGORIES") || getCategories();

// Prompt for GPT-3 model
const DEFAULT_PROMPT =
  `Write blog posts about Data Engineering in a very detailed of more than 1500 words in markdown (mdx) format about ${pickTopic()}. The content should have image or block code for example, do not include local image. The content can be something like fundamental knowledge to usage of tools. At the end of blog post, add a line about the category or the tool of that post must be in format "Category: [category]". The category should be in this list: ${CATEGORIES}. The content and title should be short and avoid using these keywords: ${await getExistedFiles()}`;
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

  const { response, content } = await generateContent();
  const { title } = await writeContent(response, content);

  if (Deno.env.get("CI") === "true") {
    await writeGithubEnv("TITLE", title);
  }
}

async function getExistedFiles() {
  const existedFiles = await readDir("./pages");
  console.log("Existed files: ", existedFiles);
  return existedFiles;
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
async function generateContent() {
  const openAI = new OpenAI(OPENAI_API_KEY);

  console.log("Requesting OpenAI API to generate the content ...");
  console.log("Prompt:", PROMPT);
  const response = await openAI.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expect technical content writer.`,
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
  }

  const filePath = `./pages/${categorySlug}/${fileSlug}.mdx`;

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

function getCategories(): string {
  return [
    "Data Engineering",
    "Database",
    "Distributed System",
    "Data Visualization",
    "DataOps",
    "Language",
    "Frameworks",
    "Algorithms",
  ].join(", ");
}

function getDefaultTopics(): string[] {
  return [
    "python",
    "spark",
    "hadoop",
    "kafka",
    "data warehouse",
    "hdfs",
    "scala",
    "clickhouse",
    "dbt",
    "sql",
    "bigquery",
    "postgresql",
    "kubernetes",
    "elasticsearch",
    "big data",
    "data pipelines",
    "data lake",
    "data integration",
    "data transformation",
    "data orchestration",
    "stream processing",
    "batch processing",
    "real-time data",
    "data governance",
    "data modeling",
    "data architecture",
    "data warehousing",
    "data catalog",
    "data quality",
    "data security",
    "data lakes",
    "data streaming",
    "data engineering",
    "dataops",
    "etl",
    "elt",
    "data integration",
    "data transformation",
    "data pipelines",
    "data orchestration",
    "data modeling",
    "data warehouse",
    "data governance",
    "data security",
    "data catalog",
    "data quality",
    "big data",
    "hadoop",
    "spark",
    "kafka",
    "airflow",
    "stream processing",
    "batch processing",
    "real-time data",
    "data lake",
    "data architecture",
    "redis",
    "elasticsearch",
    "kibana",
    "tableau",
    "rust for data engineering",
    "pandas",
    "polars",
    "distributed systems",
    "distributed computing",
    "distributed databases",
    "distributed data processing",
    "distributed data storage",
    "distributed data pipelines",
    "databricks",
    "docker",
    "apache mesos",
    "apache zookeeper",
    "apache kafka",
    "modern data stack",
    "duckdb",
    "consensus algorithms",
    "any algorithms for data engineering",
    "distributed systems",
    "storage",
    "replication",
    "any tools for data engineering",
    "trending data engineering tools",
    "List 10 data engineering algorithms then write about it",
    "List 10 data engineering tools then write detail about one of them",
    "List 10 data engineering frameworks then write detail about one of them",
  ];
}

function pickTopic() {
  const topics = getDefaultTopics();
  return topics[Math.floor(Math.random() * topics.length)];
}

await main();
