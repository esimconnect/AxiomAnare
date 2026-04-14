## Session Log — 14 Apr 2026 (RAG — knowledge base pipeline)

Completed this session:
  - match_knowledge_chunks SQL function created in Supabase
  - knowledge_chunks.embedding column altered to vector(1024)
  - knowledge_chunks schema issues resolved:
      source_file NOT NULL dropped
      source_category NOT NULL dropped
      chunk_text NOT NULL dropped
      source_category check constraint dropped
      category, source_label, content columns added
  - rag_ingest.py — chunks all KB files (MD + PDF via pdfplumber)
      600 tokens / 100 overlap, mapped to actual schema column names
      74 chunks ingested across 13 KB files
  - rag_embed.py — voyage-3 embeddings via voyageai client
      74/74 chunks embedded successfully
  - HNSW index created on knowledge_chunks.embedding
      (IVFFLAT failed — insufficient memory on free Supabase plan)
  - rag_query.js committed to repo

Dependencies installed locally (not in repo):
  pdfplumber, tiktoken, python-dotenv, requests, voyageai

.env keys required (local only, not committed):
  SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, VOYAGE_API_KEY

KB files ingested:
  - Vibration_Reference.md (26 chunks)
  - Nagahama_2025_Phase_Fault_Diagnosis.pdf (23 chunks)
  - Readme Document for IMS Bearing Data Copy.pdf (2 chunks)
  - Cooling Tower Fan-K394-11.pdf (3 chunks)
  - Reports 001–006 (8 chunks total)
  - Reports 007–009 md (12 chunks total)

Skipped:
  - ISO_10816_Chart_colour.pdf (diagram only — zero text extracted)

Files changed:
  - rag_query.js (committed)
  - rag_ingest.py (local only — in .gitignore)
  - rag_embed.py (local only — in .gitignore)
  - CONTEXT.md (this update)

Latest commit: 6eae012

Next session should:
  - Test RAG query — verify match_knowledge_chunks returns relevant chunks
  - Test app.js integration — wire rag_query.js into Claude API call
  - Then: "Payments — Stripe + PayPal integration" before deployment
  - Create Stripe products + Price IDs in Stripe Dashboard first
  - Wire _doSignup() in auth.js → Stripe Checkout Session redirect
  - Handle Stripe webhook → update profiles.tier on subscription activation