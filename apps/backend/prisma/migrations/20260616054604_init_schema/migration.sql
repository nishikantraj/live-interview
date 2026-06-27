-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('User', 'Assistant');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('Pre', 'Inprogress', 'Done');

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "gitHubMetaData" JSONB NOT NULL,
    "status" "InterviewStatus" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "interviewId" TEXT NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
