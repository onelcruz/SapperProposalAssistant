CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Solicitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requirements" TEXT[] NOT NULL,
    "criteria" JSONB NOT NULL,
    "deadline" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Solicitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalSection" (
    "id" TEXT NOT NULL,
    "solicitationId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProposalSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "editedContent" JSONB,
    "limitedCoverage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_clerkOrgId_key" ON "Company"("clerkOrgId");
CREATE UNIQUE INDEX "Document_companyId_sha256Hash_key" ON "Document"("companyId", "sha256Hash");
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE INDEX "Solicitation_companyId_idx" ON "Solicitation"("companyId");
CREATE INDEX "ProposalSection_solicitationId_idx" ON "ProposalSection"("solicitationId");
CREATE INDEX "Draft_sectionId_idx" ON "Draft"("sectionId");
CREATE INDEX "Export_draftId_idx" ON "Export"("draftId");

ALTER TABLE "Document"
    ADD CONSTRAINT "Document_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentChunk"
    ADD CONSTRAINT "DocumentChunk_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Solicitation"
    ADD CONSTRAINT "Solicitation_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProposalSection"
    ADD CONSTRAINT "ProposalSection_solicitationId_fkey"
    FOREIGN KEY ("solicitationId") REFERENCES "Solicitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Draft"
    ADD CONSTRAINT "Draft_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "ProposalSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Export"
    ADD CONSTRAINT "Export_draftId_fkey"
    FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
