-- Everything the app stores lives in `app`, which the Data API does not expose.
-- Clients read through public views and write through public functions.
create schema app;
revoke all on schema app from public;
revoke create on schema public from public;

create type app.ui_lang as enum ('en', 'ja', 'ko');
create type app.place_category as enum ('transit', 'daily', 'food', 'study', 'admin', 'health');
create type app.report_reason as enum ('wrong', 'spam', 'inappropriate', 'privacy', 'other');
create type app.item_kind as enum ('place', 'event');
