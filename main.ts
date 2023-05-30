import { load } from "https://deno.land/std/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.189.0/http/server.ts";

import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";

const env = await load();

const handler = async (request: Request): Promise<Response> => {
  
  const loader = new CheerioWebBaseLoader(
    "https://en.wikipedia.org/wiki/Brooklyn"
  );
  // load wiki page and split into smaller documents
  const docs = await loader.loadAndSplit();

  // setup an in-memory vector store using OpenAI embeddings
  const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env["OPENAI_API_KEY"] }));

  // setup a retrieval-based QA chain
  const model = new OpenAI({ openAIApiKey: env["OPENAI_API_KEY"]});
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());

  // our prompt
  // const question = "What is this article about? Can you give me 3 facts about it?";
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question') ?? "What is this article about? Can you give me 3 facts about it?";

  const res = await chain.call({
      query: question,
  });

  console.log(res.text);
  return new Response(res.text);
};

serve(handler);