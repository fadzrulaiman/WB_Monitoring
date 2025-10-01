-- AlterTable
ALTER TABLE `user` ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL;

-- Extend permission enum to include item permissions
ALTER TABLE `permission` MODIFY `name` ENUM('CREATE_USER', 'READ_USERS', 'UPDATE_USER', 'DELETE_USER', 'READ_PROFILE', 'CREATE_ITEM', 'READ_ITEMS', 'UPDATE_ITEM', 'DELETE_ITEM') NOT NULL;