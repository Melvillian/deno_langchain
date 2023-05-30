import { load } from "https://deno.land/std/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.189.0/http/server.ts";

import { CheerioWebBaseLoader } from "https://esm.sh/langchain@0.0.84/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "https://esm.sh/langchain@0.0.84/embeddings/openai";
import { MemoryVectorStore } from "https://esm.sh/langchain@0.0.84/vectorstores/memory";
import { OpenAI } from "https://esm.sh/langchain@0.0.84/llms/openai";
import { RetrievalQAChain } from "https://esm.sh/langchain@0.0.84/chains";

const env = await load();

const handler = async (request: Request): Promise<Response> => {
  
  const { searchParams } = new URL(request.url);

  const wikiPage = searchParams.get('page') ?? "https://en.wikipedia.org/wiki/Brooklyn";

  const loader = new CheerioWebBaseLoader(wikiPage);

  // load wiki page and split into smaller documents
  const docs = await loader.loadAndSplit();

  // setup an in-memory vector store using OpenAI embeddings
  const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env["OPENAI_API_KEY"] }));

  // setup a retrieval-based QA chain
  const model = new OpenAI({ openAIApiKey: env["OPENAI_API_KEY"]});
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());

  // our prompt
  // const question = "What is this article about? Can you give me 3 facts about it?";
  const question = searchParams.get('question') ?? "What is this article about? Can you give me 3 facts about it?";

  const res = await chain.call({
      query: question,
  });

  console.log(res.text);
  return new Response(res.text);
};

serve(handler);