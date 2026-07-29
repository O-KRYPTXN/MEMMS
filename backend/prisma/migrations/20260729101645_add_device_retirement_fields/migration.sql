-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "retiredAt" TIMESTAMP(3),
ADD COLUMN     "retiredById" TEXT,
ADD COLUMN     "retiredReason" TEXT;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_retiredById_fkey" FOREIGN KEY ("retiredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
