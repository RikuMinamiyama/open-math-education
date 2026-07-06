ALTER TABLE `problems` ADD `updated_by` text REFERENCES `users`(`id`) ON DELETE SET NULL;
