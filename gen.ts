#!/usr/bin/env -S deno run --allow-all

import "https://deno.land/std@0.183.0/dotenv/load.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { slug } from "https://deno.land/x/slug/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const DEFAULT_TOPICS = [
  "Kafka",
  "Python",
  "Deno",
  "Github Actions",
  "Airflow",
  "Docker",
  "Kubernetes",
  "Rust",
  "ClickHouse",
  "dbt",
  "Redshift",
  "DuckDB",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "Kibana",
  "Tableau",
];
const TOPICS = Deno.env.get("TOPICS") || DEFAULT_TOPICS;

// Prompt for GPT-3 model
const DEFAULT_PROMPT = "Write a Data Engineering blog post in Markdown format";
const PROMPT = Deno.env.get("PROMPT") || DEFAULT_PROMPT;

// Check OPENAI_API_KEY is set
if (!OPENAI_API_KEY) {
  console.error("Please set OPENAI_API_KEY");
  Deno.exit(1);
}

// Existed content
const existedFiles: string[] = [];
for await (const dirEntry of Deno.readDir("./pages")) {
  if (dirEntry.isFile && dirEntry.name.endsWith(".mdx")) {
    existedFiles.push(dirEntry.name.replace(".mdx", ""));
  }
}
console.log("Existed content", existedFiles);

const openAI = new OpenAI(OPENAI_API_KEY);

console.log("Requesting OpenAI API to generate the content ...");
const response = await openAI.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content:
        `You are a technical content writer. You write blog posts of more than 1500 words in markdown (mdx) format. The content should have image or block code for example. The content can be something like fundamental knowledge to usage of tools. If user do not mention about the topics, please pick a random of these and write about it: ${TOPICS}. The content should not duplicated with the old contents: ${existedFiles}`,
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

const title = content.split("\n")[0].trim();
console.log(`Title: ${title}`);

const fileSlug = slug(title.replace("#", ""));
console.log(`Slug: ${fileSlug}`);

const filePath = `./pages/${fileSlug}.mdx`;
console.log(`Writing content to ${filePath} ...`);
await Deno.writeTextFile(filePath, content);
console.log(`File written to ${filePath}`);

// Detect if there is CI environment
const isCI = Deno.env.get("CI") === "true";

if (isCI) {
  // Git commit
  console.log("Committing the changes ...");
  const commit = await Deno.run({
    cmd: ["git", "commit", "-am", `feat: ${title} [skip ci]`],
    stdout: "piped",
    stderr: "piped",
  }).status();

  if (!commit.success) {
    console.error("Cannot commit the changes");
    Deno.exit(1);
  }

  console.log("Changes committed");

  // Git push
  console.log("Pushing the changes ...");
  const push = await Deno.run({
    cmd: ["git", "push"],
    stdout: "piped",
    stderr: "piped",
  }).status();

  if (!push.success) {
    console.error("Cannot push the changes");
    Deno.exit(1);
  }

  console.log("Changes pushed");
}
