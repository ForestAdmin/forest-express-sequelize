# [7.12.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.5...v7.12.0) (2021-07-01)


### Features

* add typescript declaration file ([#743](https://github.com/ForestAdmin/forest-express-sequelize/issues/743)) ([a536f1c](https://github.com/ForestAdmin/forest-express-sequelize/commit/a536f1cdcbe76199b1416f19bd9c9d6c0cfbb7d3))

## [7.11.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.4...v7.11.5) (2021-06-28)


### Bug Fixes

* support inverseOf property ([#760](https://github.com/ForestAdmin/forest-express-sequelize/issues/760)) ([6fab976](https://github.com/ForestAdmin/forest-express-sequelize/commit/6fab976e0b5577e69f167d8398422ee421180f24))

## [7.11.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.3...v7.11.4) (2021-06-28)


### Bug Fixes

* **retrocompatibility:** make test suite pass with sequelize@4.x ([#761](https://github.com/ForestAdmin/forest-express-sequelize/issues/761)) ([a04be5c](https://github.com/ForestAdmin/forest-express-sequelize/commit/a04be5c97c117860544c935edaafac9952051663))

## [7.11.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.2...v7.11.3) (2021-06-23)


### Bug Fixes

* **authentication:** error during authentication when the environment is secret passed as a liana option and not an environment variable ([#758](https://github.com/ForestAdmin/forest-express-sequelize/issues/758)) ([39ab674](https://github.com/ForestAdmin/forest-express-sequelize/commit/39ab674f21cc607b0000937b784b031efbc154d7))

## [7.11.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.1...v7.11.2) (2021-06-15)


### Bug Fixes

* **intercom:** fix date conversion from unix timestamp to js date of intercom attributes ([#754](https://github.com/ForestAdmin/forest-express-sequelize/issues/754)) ([11a1549](https://github.com/ForestAdmin/forest-express-sequelize/commit/11a1549f61407e15587d976b1b40bc916341e975))

## [7.11.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.11.0...v7.11.1) (2021-06-10)


### Bug Fixes

* prevent IP check from failing for the proxies including the port in the headers ([#751](https://github.com/ForestAdmin/forest-express-sequelize/issues/751)) ([92852f7](https://github.com/ForestAdmin/forest-express-sequelize/commit/92852f74831dd33f1ae411d61b2f576ea8f309be))

# [7.11.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.10.2...v7.11.0) (2021-06-09)


### Features

* include role in the user data inside the request ([#746](https://github.com/ForestAdmin/forest-express-sequelize/issues/746)) ([425bba5](https://github.com/ForestAdmin/forest-express-sequelize/commit/425bba58268a7561b675348b91c00cbc5e695efb))

## [7.10.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.10.1...v7.10.2) (2021-06-08)


### Bug Fixes

* fix mssql ordering collection by pk ([#734](https://github.com/ForestAdmin/forest-express-sequelize/issues/734)) ([7bbd19d](https://github.com/ForestAdmin/forest-express-sequelize/commit/7bbd19db7d304c7d9c50724b38585f117aa75b19))

## [7.10.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.10.0...v7.10.1) (2021-06-03)


### Bug Fixes

* correctly get the IP address from the request headers ([#737](https://github.com/ForestAdmin/forest-express-sequelize/issues/737)) ([b2fbdca](https://github.com/ForestAdmin/forest-express-sequelize/commit/b2fbdca4ee3a72b7700c888a2882f28d03c3767d))

# [7.10.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.9.4...v7.10.0) (2021-06-03)


### Features

* **schema:** move some meta data under stack attribute to prevent blocking scenarios on DWO ([#736](https://github.com/ForestAdmin/forest-express-sequelize/issues/736)) ([1876c97](https://github.com/ForestAdmin/forest-express-sequelize/commit/1876c975a1498879dc08862d8306a4f7e4140aa6))

## [7.9.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.9.3...v7.9.4) (2021-06-03)


### Bug Fixes

* allow injection of relations when using smartfield' search feature ([#735](https://github.com/ForestAdmin/forest-express-sequelize/issues/735)) ([6a39f05](https://github.com/ForestAdmin/forest-express-sequelize/commit/6a39f05b867c4ab0860ec8b92f5759c33c531b46))

## [7.9.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.9.2...v7.9.3) (2021-05-25)


### Bug Fixes

* **smart-actions-change-hook:** record is no longer altered and is sent correctly ([#728](https://github.com/ForestAdmin/forest-express-sequelize/issues/728)) ([2ac7af8](https://github.com/ForestAdmin/forest-express-sequelize/commit/2ac7af8105e7d543556ca9b8497557a675e58d91))

## [7.9.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.9.1...v7.9.2) (2021-05-21)


### Bug Fixes

* distribution charts using groupby on a relationship throws 403 Forbidden ([#725](https://github.com/ForestAdmin/forest-express-sequelize/issues/725)) ([30e6744](https://github.com/ForestAdmin/forest-express-sequelize/commit/30e6744b02a9f95d44bb2265a187c4c3cf0a4027))

## [7.9.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.9.0...v7.9.1) (2021-05-12)


### Bug Fixes

* regression when fetching has-many and not selecting any fields on a hasone/belongsto relation ([#720](https://github.com/ForestAdmin/forest-express-sequelize/issues/720)) ([74ed623](https://github.com/ForestAdmin/forest-express-sequelize/commit/74ed6230b35c41e264854fafcb4c60667ff7ac99))

# [7.9.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.8.0...v7.9.0) (2021-05-11)


### Features

* **filters:** add support for the \`model.field IN array\` filter condition ([#719](https://github.com/ForestAdmin/forest-express-sequelize/issues/719)) ([5f58457](https://github.com/ForestAdmin/forest-express-sequelize/commit/5f5845758d8e93f493d82cf796ba1de9b058b9ac))

# [7.8.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.7.0...v7.8.0) (2021-05-06)


### Features

* add support for belongsTo and hasOne filters on related data ([#715](https://github.com/ForestAdmin/forest-express-sequelize/issues/715)) ([2bc769e](https://github.com/ForestAdmin/forest-express-sequelize/commit/2bc769e97f7c2807a6af3a8f68aba4be698bec77))

# [7.7.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.6.4...v7.7.0) (2021-04-28)


### Features

* support yarn 2 plug n play install mode ([#698](https://github.com/ForestAdmin/forest-express-sequelize/issues/698)) ([64b5734](https://github.com/ForestAdmin/forest-express-sequelize/commit/64b5734af0e6da5d2a3f73ddb44966162aa5a317))

## [7.6.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.6.3...v7.6.4) (2021-04-27)


### Bug Fixes

* **schema:** do not remove primary key fields from the schema when tables have foreign keys that are primary keys ([8844fb5](https://github.com/ForestAdmin/forest-express-sequelize/commit/8844fb5631ce6335dc66d7ee33433b12e2618611))

## [7.6.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.6.2...v7.6.3) (2021-04-22)


### Bug Fixes

* **search:** enable to search for a big integer in an ID field ([#695](https://github.com/ForestAdmin/forest-express-sequelize/issues/695)) ([9f8132c](https://github.com/ForestAdmin/forest-express-sequelize/commit/9f8132c3c920b4a29178fd35cf4dc56179cc8c8b))

## [7.6.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.6.1...v7.6.2) (2021-04-22)


### Bug Fixes

* **search:** searching for a big int value should not break if there is a regular integer field ([#694](https://github.com/ForestAdmin/forest-express-sequelize/issues/694)) ([af076ad](https://github.com/ForestAdmin/forest-express-sequelize/commit/af076ad208b0bfb9e186568b13ea488d0a2c545f))

## [7.6.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.6.0...v7.6.1) (2021-04-21)


### Bug Fixes

* **security:** patch ssri dependency vulnerability ([#690](https://github.com/ForestAdmin/forest-express-sequelize/issues/690)) ([6b0770d](https://github.com/ForestAdmin/forest-express-sequelize/commit/6b0770d91ffdecff0a78d5c623b3a28d40c17744))

# [7.6.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.5.1...v7.6.0) (2021-04-16)


### Features

* expose utils to parse filters ([#683](https://github.com/ForestAdmin/forest-express-sequelize/issues/683)) ([4333529](https://github.com/ForestAdmin/forest-express-sequelize/commit/4333529a64a172484ab307d587a633c472096d53))

## [7.5.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.5.0...v7.5.1) (2021-04-16)


### Bug Fixes

* **date-filter:** filtering only on hours now returns the expected records ([#684](https://github.com/ForestAdmin/forest-express-sequelize/issues/684)) ([135ac47](https://github.com/ForestAdmin/forest-express-sequelize/commit/135ac475188d7373b375667b909d092d06b9b68b))

# [7.5.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.4.0...v7.5.0) (2021-04-12)


### Features

* **smart-action:** handle isReadOnly field in smart action forms ([#680](https://github.com/ForestAdmin/forest-express-sequelize/issues/680)) ([18dd191](https://github.com/ForestAdmin/forest-express-sequelize/commit/18dd191d525016835005cdf7d7fb0955ef9a2057))

# [7.4.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.7...v7.4.0) (2021-04-09)


### Features

* **smart-action:** support hooks for smart collection ([#679](https://github.com/ForestAdmin/forest-express-sequelize/issues/679)) ([5d80f8a](https://github.com/ForestAdmin/forest-express-sequelize/commit/5d80f8a4e0ec12e2fb6d7a5c2098c7a69db05e5e))

## [7.3.7](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.6...v7.3.7) (2021-04-07)

## [7.3.6](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.5...v7.3.6) (2021-04-06)


### Bug Fixes

* **security:** patch marked dependency vulnerabilities ([#674](https://github.com/ForestAdmin/forest-express-sequelize/issues/674)) ([5331694](https://github.com/ForestAdmin/forest-express-sequelize/commit/53316944d68e1943435f290544e9d2480eda9af0))

## [7.3.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.4...v7.3.5) (2021-04-01)


### Bug Fixes

* **security:** patch forest-express transitive vulnerabilities ([#672](https://github.com/ForestAdmin/forest-express-sequelize/issues/672)) ([e5135d2](https://github.com/ForestAdmin/forest-express-sequelize/commit/e5135d208c0d878fb319e220fb334272c6dcdf72))

## [7.3.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.3...v7.3.4) (2021-04-01)


### Bug Fixes

* **security:** patch y18n dependency vulnerabilities ([#671](https://github.com/ForestAdmin/forest-express-sequelize/issues/671)) ([884a400](https://github.com/ForestAdmin/forest-express-sequelize/commit/884a400f748e26935b1081674431846fde092585))

## [7.3.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.2...v7.3.3) (2021-03-31)


### Bug Fixes

* **security:** patch ini dependency vulnérability ([#670](https://github.com/ForestAdmin/forest-express-sequelize/issues/670)) ([3eb0958](https://github.com/ForestAdmin/forest-express-sequelize/commit/3eb0958b0495954dcbf957637a1ff636151432a7))

## [7.3.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.1...v7.3.2) (2021-03-31)


### Bug Fixes

* **security:** patch node-notifier vulnerabilities ([#669](https://github.com/ForestAdmin/forest-express-sequelize/issues/669)) ([a54b944](https://github.com/ForestAdmin/forest-express-sequelize/commit/a54b944e88b666ad6d05e5b7e2cf52355a26ac5b))

## [7.3.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.3.0...v7.3.1) (2021-03-25)


### Bug Fixes

* **search:** highlighting not working when the column name contains underscores ([45ac144](https://github.com/ForestAdmin/forest-express-sequelize/commit/45ac1442fec3cd5e93935ba19eec2496922ab1ad))
* search highlighting not working when the column name contains underscores ([ca28ba9](https://github.com/ForestAdmin/forest-express-sequelize/commit/ca28ba96da12ba631e637621a50e015fb1064f22))

# [7.3.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.2.2...v7.3.0) (2021-03-25)


### Features

* add filters support on related data ([#658](https://github.com/ForestAdmin/forest-express-sequelize/issues/658)) ([515fb70](https://github.com/ForestAdmin/forest-express-sequelize/commit/515fb70712bb5e8bd3432c1d4aabba04702f503c))

## [7.2.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.2.1...v7.2.2) (2021-03-19)


### Bug Fixes

* **security:** authorised only allowed stats queries using permissions ([#657](https://github.com/ForestAdmin/forest-express-sequelize/issues/657)) ([bc4913c](https://github.com/ForestAdmin/forest-express-sequelize/commit/bc4913cbe1ca59f60fa3d2f76fb857c3e94ce8fb))

## [7.2.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.2.0...v7.2.1) (2021-03-18)


### Bug Fixes

* **security:** downgrade forest-express while the charts are broken ([#656](https://github.com/ForestAdmin/forest-express-sequelize/issues/656)) ([a178b74](https://github.com/ForestAdmin/forest-express-sequelize/commit/a178b74048826ed5415aed2f574cc7a176f5c8a7))

# [7.2.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.1.2...v7.2.0) (2021-03-15)


### Features

* **security:** authorised only allowed stats queries using permissions ([#654](https://github.com/ForestAdmin/forest-express-sequelize/issues/654)) ([2ad75e3](https://github.com/ForestAdmin/forest-express-sequelize/commit/2ad75e3b39838cc7be62a71cbadcedc0d8977f63))

## [7.1.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.1.1...v7.1.2) (2021-03-11)


### Bug Fixes

* **security:** decrease the time before expiration of forest session token ([#652](https://github.com/ForestAdmin/forest-express-sequelize/issues/652)) ([c242839](https://github.com/ForestAdmin/forest-express-sequelize/commit/c2428394e8a3a096cf45fbed8a7df1536cbe70fe))

## [7.1.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.1.0...v7.1.1) (2021-03-10)


### Bug Fixes

* **authentication:** unable to login when the agents respond to an url starting with a prefix ([#651](https://github.com/ForestAdmin/forest-express-sequelize/issues/651)) ([e2cd4e4](https://github.com/ForestAdmin/forest-express-sequelize/commit/e2cd4e4ecb1fefb42211b6404c71302b16d0bdba))

# [7.1.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.3...v7.1.0) (2021-03-05)


### Features

* **filter:** add "includes all" filter to array type ([21f9669](https://github.com/ForestAdmin/forest-express-sequelize/commit/21f96694cb5453369555d6cb549eab476b962b8c))
* **filter:** add "includes all" filter to array type ([9d12de2](https://github.com/ForestAdmin/forest-express-sequelize/commit/9d12de22a109e43465adfb644c4aafca237b2ab2))

## [7.0.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.2...v7.0.3) (2021-03-05)


### Bug Fixes

* **security:** patch lodash vulnerabilities ([#647](https://github.com/ForestAdmin/forest-express-sequelize/issues/647)) ([1dcd728](https://github.com/ForestAdmin/forest-express-sequelize/commit/1dcd728b86e145f289dbda363fd0a07d86b29d1c))

## [7.0.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.1...v7.0.2) (2021-03-05)


### Bug Fixes

* **security:** patch lodash vulnerabilities ([#628](https://github.com/ForestAdmin/forest-express-sequelize/issues/628)) ([2c0449a](https://github.com/ForestAdmin/forest-express-sequelize/commit/2c0449a738fbe2e8122c037ba087770c9353a38c))

## [7.0.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0...v7.0.1) (2021-03-04)


### Bug Fixes

* **authentication:** safari cannot login on remote lianas because of third party cookies ([#646](https://github.com/ForestAdmin/forest-express-sequelize/issues/646)) ([92f80b9](https://github.com/ForestAdmin/forest-express-sequelize/commit/92f80b904a517970320f33aecf2e3dc22ad5c232))

# [7.0.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.11...v7.0.0) (2021-02-22)


### Bug Fixes

* **authentication:** error when authenticating with an invalid token in cookies ([#593](https://github.com/ForestAdmin/forest-express-sequelize/issues/593)) ([405feb4](https://github.com/ForestAdmin/forest-express-sequelize/commit/405feb439e34746b385203eb995aec92e955eeab))
* connect to liana through safari ([#590](https://github.com/ForestAdmin/forest-express-sequelize/issues/590)) ([6a0fcb3](https://github.com/ForestAdmin/forest-express-sequelize/commit/6a0fcb346c71f561e80b7d691f38774eaa8c24b9))
* fix incorrect usage of the new connections parameter ([#557](https://github.com/ForestAdmin/forest-express-sequelize/issues/557)) ([2840e41](https://github.com/ForestAdmin/forest-express-sequelize/commit/2840e418bb782a83b861dda217d45b3d70175253))
* user being disconnected after 33min instead of 14 days ([#591](https://github.com/ForestAdmin/forest-express-sequelize/issues/591)) ([2e2dc81](https://github.com/ForestAdmin/forest-express-sequelize/commit/2e2dc811f497acb0d771497c55b75349480e46a5))


### Features

* init function now uses connections & objectMapping instead of sequelize as parameter ([#539](https://github.com/ForestAdmin/forest-express-sequelize/issues/539)) ([74262ac](https://github.com/ForestAdmin/forest-express-sequelize/commit/74262acfc7d77ce1e0aa1b2f44d3e69b7fce470a))
* return correct errors when the user needs to configure the 2FA ([#609](https://github.com/ForestAdmin/forest-express-sequelize/issues/609)) ([08b64a0](https://github.com/ForestAdmin/forest-express-sequelize/commit/08b64a038f2d9aef206710234d16d6e877274967))


### BREAKING CHANGES

* sequelize options is not supported anymore by Liana.init()
connections and objectMapping is now required on Liana.init().
Update forest-express dependency to 8.0.0-beta.1 (See https://github.com/ForestAdmin/forest-express/tree/v8.0.0-beta.1)

Co-authored-by: jeffladiray <ladirayjeff@gmail.com>

# [7.0.0-beta.12](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.11...v7.0.0-beta.12) (2021-02-22)


### Bug Fixes

* fix error when no foreign key is found but foreign and primary key is detected ([#632](https://github.com/ForestAdmin/forest-express-sequelize/issues/632)) ([6f06512](https://github.com/ForestAdmin/forest-express-sequelize/commit/6f0651264e28cb8259589f04f4c0a3eabcb59bb6))

# [7.0.0-beta.11](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.10...v7.0.0-beta.11) (2021-02-22)


### Bug Fixes

* fix record creation with unconventional pk field acting as a fk ([#598](https://github.com/ForestAdmin/forest-express-sequelize/issues/598)) ([d3779b7](https://github.com/ForestAdmin/forest-express-sequelize/commit/d3779b75f553830574c51850dfdec5c6ab3eabc6))
* support foreign and primary key column ([#630](https://github.com/ForestAdmin/forest-express-sequelize/issues/630)) ([2a289b8](https://github.com/ForestAdmin/forest-express-sequelize/commit/2a289b805727d51d112719ee29af28b7745bff73))
* **search:** don't convert float values to bigint ([75c1517](https://github.com/ForestAdmin/forest-express-sequelize/commit/75c151720bb9c260272325f1f2c088b0c9050ac7))
* **search:** handle large numbers in search queries ([c0c1c70](https://github.com/ForestAdmin/forest-express-sequelize/commit/c0c1c70686ecdaab9c9e6bbf432f44a414cf8c2e))
* **search:** handle large numbers in search queries ([#621](https://github.com/ForestAdmin/forest-express-sequelize/issues/621)) ([ec6ab89](https://github.com/ForestAdmin/forest-express-sequelize/commit/ec6ab8989cde26af379f814fa7ee4bd28a1cddd6))
* **search:** handle tables that contain floats and bigints ([7ac2fe1](https://github.com/ForestAdmin/forest-express-sequelize/commit/7ac2fe152ae01af98484d88e8c98c612bcb50573))
* **search:** revert changes when numbers are below MAX_SAFE_INTEGER ([1d95021](https://github.com/ForestAdmin/forest-express-sequelize/commit/1d95021f55a64a519d71c301ceb810196abfdd34))

## [6.7.11](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.10...v6.7.11) (2021-02-22)


### Bug Fixes

* fix error when no foreign key is found but foreign and primary key is detected ([#632](https://github.com/ForestAdmin/forest-express-sequelize/issues/632)) ([6f06512](https://github.com/ForestAdmin/forest-express-sequelize/commit/6f0651264e28cb8259589f04f4c0a3eabcb59bb6))

## [6.7.10](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.9...v6.7.10) (2021-02-22)


### Bug Fixes

* support foreign and primary key column ([#630](https://github.com/ForestAdmin/forest-express-sequelize/issues/630)) ([2a289b8](https://github.com/ForestAdmin/forest-express-sequelize/commit/2a289b805727d51d112719ee29af28b7745bff73))

## [6.7.9](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.8...v6.7.9) (2021-02-22)


### Bug Fixes

* fix record creation with unconventional pk field acting as a fk ([#598](https://github.com/ForestAdmin/forest-express-sequelize/issues/598)) ([d3779b7](https://github.com/ForestAdmin/forest-express-sequelize/commit/d3779b75f553830574c51850dfdec5c6ab3eabc6))

## [6.7.8](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.7...v6.7.8) (2021-02-19)


### Bug Fixes

* **search:** don't convert float values to bigint ([75c1517](https://github.com/ForestAdmin/forest-express-sequelize/commit/75c151720bb9c260272325f1f2c088b0c9050ac7))
* **search:** handle large numbers in search queries ([c0c1c70](https://github.com/ForestAdmin/forest-express-sequelize/commit/c0c1c70686ecdaab9c9e6bbf432f44a414cf8c2e))
* **search:** handle large numbers in search queries ([#621](https://github.com/ForestAdmin/forest-express-sequelize/issues/621)) ([ec6ab89](https://github.com/ForestAdmin/forest-express-sequelize/commit/ec6ab8989cde26af379f814fa7ee4bd28a1cddd6))
* **search:** handle tables that contain floats and bigints ([7ac2fe1](https://github.com/ForestAdmin/forest-express-sequelize/commit/7ac2fe152ae01af98484d88e8c98c612bcb50573))
* **search:** revert changes when numbers are below MAX_SAFE_INTEGER ([1d95021](https://github.com/ForestAdmin/forest-express-sequelize/commit/1d95021f55a64a519d71c301ceb810196abfdd34))

# [7.0.0-beta.10](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.9...v7.0.0-beta.10) (2021-02-09)

### Bug Fixes

* array display with smart field ([#575](https://github.com/ForestAdmin/forest-express-sequelize/issues/575)) ([e0698d3](https://github.com/ForestAdmin/forest-express-sequelize/commit/e0698d30f9ae1a792a51b61bb74a8a29753d1317))
* correctly set fields holding  belongsTo relationships to null when updated with a null value ([#607](https://github.com/ForestAdmin/forest-express-sequelize/issues/607)) ([374151f](https://github.com/ForestAdmin/forest-express-sequelize/commit/374151fcfa7d3e70ce5817039749656250131e2f))
* display correct reference field when it is a smartfield ([#584](https://github.com/ForestAdmin/forest-express-sequelize/issues/584)) ([50aef31](https://github.com/ForestAdmin/forest-express-sequelize/commit/50aef319977555c31f853d4436fcfa6694f85b26))
* fix belongsTo relationships creation when creating a record ([#602](https://github.com/ForestAdmin/forest-express-sequelize/issues/602)) ([e06dbc8](https://github.com/ForestAdmin/forest-express-sequelize/commit/e06dbc831dddeffed8d13a8a942b3998ef2982bf))
* fix related data list display ([#578](https://github.com/ForestAdmin/forest-express-sequelize/issues/578)) ([370dba7](https://github.com/ForestAdmin/forest-express-sequelize/commit/370dba7c0c60a64dad6688a54e62cc508e44b9b5))
* fix unconventional pk when referenced as null on creation ([#608](https://github.com/ForestAdmin/forest-express-sequelize/issues/608)) ([af70d62](https://github.com/ForestAdmin/forest-express-sequelize/commit/af70d62d36052ab0b77295a581d82ae69068ccda))
* handle foreign key toward non primary key ([#585](https://github.com/ForestAdmin/forest-express-sequelize/issues/585)) ([64c78c7](https://github.com/ForestAdmin/forest-express-sequelize/commit/64c78c7545bc03fa03984572b39cf6977e927f17))
* secure sql queries generated by leaderboard stats ([#611](https://github.com/ForestAdmin/forest-express-sequelize/issues/611)) ([f41d79c](https://github.com/ForestAdmin/forest-express-sequelize/commit/f41d79c979b01a9d15e8354df94918e27faf9187))
* **forestadmin-schema:** regenerate forestadmin schema only when files are valid ([#597](https://github.com/ForestAdmin/forest-express-sequelize/issues/597)) ([a24abbd](https://github.com/ForestAdmin/forest-express-sequelize/commit/a24abbdfd91c24aff87fc649e9889e5d88cef61d))
* **leaderboard:** fix an error when use "user" table ([#565](https://github.com/ForestAdmin/forest-express-sequelize/issues/565)) ([0cbbc32](https://github.com/ForestAdmin/forest-express-sequelize/commit/0cbbc326b0f8ff686ed1e6b37dc719005e06866a))
* **smart-action-hook:** value injected to an enum field of type  is now correctly handled ([#600](https://github.com/ForestAdmin/forest-express-sequelize/issues/600)) ([c0a3b58](https://github.com/ForestAdmin/forest-express-sequelize/commit/c0a3b58dc272f91d1802fa00dca3b3c79ca56e01))


### Features

* **filter:** add possibility to filter on smart field ([eaead56](https://github.com/ForestAdmin/forest-express-sequelize/commit/eaead56004a67edd4d266dc1583c43146ca393c3))
* **filter:** add possibility to filter on smart field ([#583](https://github.com/ForestAdmin/forest-express-sequelize/issues/583)) ([dbf136a](https://github.com/ForestAdmin/forest-express-sequelize/commit/dbf136a2f8b1fd7b3694769792e9e15b4a93a6e4))
* **smart actions:** introduce smart action forms hooks ([#569](https://github.com/ForestAdmin/forest-express-sequelize/issues/569)) ([cd13029](https://github.com/ForestAdmin/forest-express-sequelize/commit/cd13029551e6b6cbee0ecaed4c51d0bf44794e0a))

## [6.7.7](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.6...v6.7.7) (2021-02-05)


### Bug Fixes

* secure sql queries generated by leaderboard stats ([#611](https://github.com/ForestAdmin/forest-express-sequelize/issues/611)) ([f41d79c](https://github.com/ForestAdmin/forest-express-sequelize/commit/f41d79c979b01a9d15e8354df94918e27faf9187
))

# [7.0.0-beta.9](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.8...v7.0.0-beta.9) (2021-02-02)


### Features

* return correct errors when the user needs to configure the 2FA ([#609](https://github.com/ForestAdmin/forest-express-sequelize/issues/609)) ([08b64a0](https://github.com/ForestAdmin/forest-express-sequelize/commit/08b64a038f2d9aef206710234d16d6e877274967))


## [6.7.6](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.5...v6.7.6) (2021-02-02)


### Bug Fixes

* fix unconventional pk when referenced as null on creation ([#608](https://github.com/ForestAdmin/forest-express-sequelize/issues/608)) ([af70d62](https://github.com/ForestAdmin/forest-express-sequelize/commit/af70d62d36052ab0b77295a581d82ae69068ccda))

## [6.7.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.4...v6.7.5) (2021-01-27)


### Bug Fixes

* correctly set fields holding  belongsTo relationships to null when updated with a null value ([#607](https://github.com/ForestAdmin/forest-express-sequelize/issues/607)) ([374151f](https://github.com/ForestAdmin/forest-express-sequelize/commit/374151fcfa7d3e70ce5817039749656250131e2f))

## [6.7.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.3...v6.7.4) (2021-01-22)


### Bug Fixes

* fix belongsTo relationships creation when creating a record ([#602](https://github.com/ForestAdmin/forest-express-sequelize/issues/602)) ([e06dbc8](https://github.com/ForestAdmin/forest-express-sequelize/commit/e06dbc831dddeffed8d13a8a942b3998ef2982bf))

## [6.7.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.2...v6.7.3) (2021-01-21)


### Bug Fixes

* handle foreign key toward non primary key ([#585](https://github.com/ForestAdmin/forest-express-sequelize/issues/585)) ([64c78c7](https://github.com/ForestAdmin/forest-express-sequelize/commit/64c78c7545bc03fa03984572b39cf6977e927f17))

## [6.7.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.1...v6.7.2) (2021-01-20)


### Bug Fixes

* **smart-action-hook:** value injected to an enum field of type  is now correctly handled ([#600](https://github.com/ForestAdmin/forest-express-sequelize/issues/600)) ([c0a3b58](https://github.com/ForestAdmin/forest-express-sequelize/commit/c0a3b58dc272f91d1802fa00dca3b3c79ca56e01))

## [6.7.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.7.0...v6.7.1) (2021-01-18)


### Bug Fixes

* **forestadmin-schema:** regenerate forestadmin schema only when files are valid ([#597](https://github.com/ForestAdmin/forest-express-sequelize/issues/597)) ([a24abbd](https://github.com/ForestAdmin/forest-express-sequelize/commit/a24abbdfd91c24aff87fc649e9889e5d88cef61d))

# [6.7.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.6.3...v6.7.0) (2021-01-14)


### Features

* **filter:** add possibility to filter on smart field ([eaead56](https://github.com/ForestAdmin/forest-express-sequelize/commit/eaead56004a67edd4d266dc1583c43146ca393c3))
* **filter:** add possibility to filter on smart field ([#583](https://github.com/ForestAdmin/forest-express-sequelize/issues/583)) ([dbf136a](https://github.com/ForestAdmin/forest-express-sequelize/commit/dbf136a2f8b1fd7b3694769792e9e15b4a93a6e4))

# [7.0.0-beta.8](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.7...v7.0.0-beta.8) (2021-01-08)


### Bug Fixes

* **authentication:** error when authenticating with an invalid token in cookies ([#593](https://github.com/ForestAdmin/forest-express-sequelize/issues/593)) ([405feb4](https://github.com/ForestAdmin/forest-express-sequelize/commit/405feb439e34746b385203eb995aec92e955eeab))

# [7.0.0-beta.7](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.6...v7.0.0-beta.7) (2021-01-06)


### Bug Fixes

* user being disconnected after 33min instead of 14 days ([#591](https://github.com/ForestAdmin/forest-express-sequelize/issues/591)) ([2e2dc81](https://github.com/ForestAdmin/forest-express-sequelize/commit/2e2dc811f497acb0d771497c55b75349480e46a5))

# [7.0.0-beta.6](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.5...v7.0.0-beta.6) (2021-01-06)


### Bug Fixes

* connect to liana through safari ([#590](https://github.com/ForestAdmin/forest-express-sequelize/issues/590)) ([6a0fcb3](https://github.com/ForestAdmin/forest-express-sequelize/commit/6a0fcb346c71f561e80b7d691f38774eaa8c24b9))

# [7.0.0-beta.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.4...v7.0.0-beta.5) (2020-12-30)

# [7.0.0-beta.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.3...v7.0.0-beta.4) (2020-12-23)

## [6.6.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.6.2...v6.6.3) (2020-12-21)


### Bug Fixes

* display correct reference field when it is a smartfield ([#584](https://github.com/ForestAdmin/forest-express-sequelize/issues/584)) ([50aef31](https://github.com/ForestAdmin/forest-express-sequelize/commit/50aef319977555c31f853d4436fcfa6694f85b26))

## [6.6.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.6.1...v6.6.2) (2020-12-15)


### Bug Fixes

* fix related data list display ([#578](https://github.com/ForestAdmin/forest-express-sequelize/issues/578)) ([370dba7](https://github.com/ForestAdmin/forest-express-sequelize/commit/370dba7c0c60a64dad6688a54e62cc508e44b9b5))

## [6.6.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.6.0...v6.6.1) (2020-12-11)


### Bug Fixes

* array display with smart field ([#575](https://github.com/ForestAdmin/forest-express-sequelize/issues/575)) ([e0698d3](https://github.com/ForestAdmin/forest-express-sequelize/commit/e0698d30f9ae1a792a51b61bb74a8a29753d1317))

# [6.6.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.5.1...v6.6.0) (2020-12-09)


### Features

* **smart actions:** endpoint that handle forms' load hooks ([0902ef4](https://github.com/ForestAdmin/forest-express-sequelize/commit/0902ef458abf41efb25f0dc024549702a50645fe))
* **smart actions:** introduce smart action forms hooks ([#569](https://github.com/ForestAdmin/forest-express-sequelize/issues/569)) ([cd13029](https://github.com/ForestAdmin/forest-express-sequelize/commit/cd13029551e6b6cbee0ecaed4c51d0bf44794e0a))

## [6.5.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.5.0...v6.5.1) (2020-12-09)


### Bug Fixes

* **leaderboard:** fix an error when use "user" table ([#565](https://github.com/ForestAdmin/forest-express-sequelize/issues/565)) ([0cbbc32](https://github.com/ForestAdmin/forest-express-sequelize/commit/0cbbc326b0f8ff686ed1e6b37dc719005e06866a))

# [7.0.0-beta.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.2...v7.0.0-beta.3) (2020-12-02)


### Bug Fixes

* always return primary keys of associated records ([#550](https://github.com/ForestAdmin/forest-express-sequelize/issues/550)) ([57bd84b](https://github.com/ForestAdmin/forest-express-sequelize/commit/57bd84bc992bbe5fd703b2e36c02bb431885535d))
* export error handler middleware ([#552](https://github.com/ForestAdmin/forest-express-sequelize/issues/552)) ([a87591b](https://github.com/ForestAdmin/forest-express-sequelize/commit/a87591b8d5cffc5041fedcb654be2fadfb6dd78f))

# [7.0.0-beta.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v7.0.0-beta.1...v7.0.0-beta.2) (2020-11-30)


### Bug Fixes

* fix incorrect usage of the new connections parameter ([#557](https://github.com/ForestAdmin/forest-express-sequelize/issues/557)) ([2840e41](https://github.com/ForestAdmin/forest-express-sequelize/commit/2840e418bb782a83b861dda217d45b3d70175253))

# [6.5.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.4.2...v6.5.0) (2020-11-27)


### Features

* **smart actions:** endpoint that handle forms' load hooks ([0902ef4](https://github.com/ForestAdmin/forest-express-sequelize/commit/0902ef458abf41efb25f0dc024549702a50645fe))

## [6.4.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.4.1...v6.4.2) (2020-11-26)


### Bug Fixes

* export error handler middleware ([#552](https://github.com/ForestAdmin/forest-express-sequelize/issues/552)) ([a87591b](https://github.com/ForestAdmin/forest-express-sequelize/commit/a87591b8d5cffc5041fedcb654be2fadfb6dd78f))

## [6.4.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.4.0...v6.4.1) (2020-11-26)


### Bug Fixes

* always return primary keys of associated records ([#550](https://github.com/ForestAdmin/forest-express-sequelize/issues/550)) ([57bd84b](https://github.com/ForestAdmin/forest-express-sequelize/commit/57bd84bc992bbe5fd703b2e36c02bb431885535d))

# [7.0.0-beta.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.4.0...v7.0.0-beta.1) (2020-11-24)


### Features

* init function now uses connections & objectMapping instead of sequelize as parameter ([#539](https://github.com/ForestAdmin/forest-express-sequelize/issues/539)) ([74262ac](https://github.com/ForestAdmin/forest-express-sequelize/commit/74262acfc7d77ce1e0aa1b2f44d3e69b7fce470a))


### BREAKING CHANGES

* sequelize options is not supported anymore by Liana.init()
connections and objectMapping is now required on Liana.init().
Update forest-express dependency to 8.0.0-beta.1 (See https://github.com/ForestAdmin/forest-express/tree/v8.0.0-beta.1)

# [6.4.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.15...v6.4.0) (2020-11-17)


### Features

* **smart actions:** add hooks in schema file ([#542](https://github.com/ForestAdmin/forest-express-sequelize/issues/542)) ([f1cd375](https://github.com/ForestAdmin/forest-express-sequelize/commit/f1cd37585c90c5fe10be48ad6bb65ce8b0626387))

## [6.3.15](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.14...v6.3.15) (2020-11-13)


### Bug Fixes

* don't compute smart fields when not requested on associated records ([#540](https://github.com/ForestAdmin/forest-express-sequelize/issues/540)) ([5c95163](https://github.com/ForestAdmin/forest-express-sequelize/commit/5c95163ddd5b94e1c74c623c9c66769116eab71b))

## [6.3.14](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.13...v6.3.14) (2020-11-03)


### Bug Fixes

* request the right fields for belongsTo relationships with casing difference between DB and JS ([#530](https://github.com/ForestAdmin/forest-express-sequelize/issues/530)) ([84de297](https://github.com/ForestAdmin/forest-express-sequelize/commit/84de297a9c0278a86f768ec456940a50fd6647ab))

## [6.3.13](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.12...v6.3.13) (2020-10-05)


### Bug Fixes

* fix an error when accessing tables with a hasOne relationship ([#512](https://github.com/ForestAdmin/forest-express-sequelize/issues/512)) ([bb2f51e](https://github.com/ForestAdmin/forest-express-sequelize/commit/bb2f51e8ed5db6b4fb4c2b57a6939882de789c03))

## [6.3.12](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.11...v6.3.12) (2020-10-01)


### Bug Fixes

* **leaderboard chart:** fix query on many to many relationship ([#510](https://github.com/ForestAdmin/forest-express-sequelize/issues/510)) ([0e90750](https://github.com/ForestAdmin/forest-express-sequelize/commit/0e90750e7c16aca803019d8be5516853a4d43168))

## [6.3.11](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.10...v6.3.11) (2020-09-09)


### Bug Fixes

* allow search on fields number ([#506](https://github.com/ForestAdmin/forest-express-sequelize/issues/506)) ([80fbf7c](https://github.com/ForestAdmin/forest-express-sequelize/commit/80fbf7ce887f3919f4b923a382d3d727d5d610c5))

## [6.3.10](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.9...v6.3.10) (2020-09-08)


### Bug Fixes

* :bug: fix retrieved fields from the database when a smart field is used as a reference field ([#505](https://github.com/ForestAdmin/forest-express-sequelize/issues/505)) ([14286fb](https://github.com/ForestAdmin/forest-express-sequelize/commit/14286fb9e82bc0fce3a3c04fedf0844fb2836ff8))

## [6.3.9](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.8...v6.3.9) (2020-09-04)


### Bug Fixes

* :bug: set primary keys as required if not generated ([#501](https://github.com/ForestAdmin/forest-express-sequelize/issues/501)) ([f977b37](https://github.com/ForestAdmin/forest-express-sequelize/commit/f977b3765c27202f9674cda5656dfc28be619ed3))

## [6.3.8](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.7...v6.3.8) (2020-09-01)


### Bug Fixes

* :bug: fix a regression introduced by changes in the build ([#496](https://github.com/ForestAdmin/forest-express-sequelize/issues/496)) ([89d94fe](https://github.com/ForestAdmin/forest-express-sequelize/commit/89d94fe77efe3861750924f542b93b6a25810e58))

## [6.3.7](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.6...v6.3.7) (2020-08-31)


### Performance Improvements

* :zap: only return ids of related records, not all fields ([#477](https://github.com/ForestAdmin/forest-express-sequelize/issues/477)) ([435c061](https://github.com/ForestAdmin/forest-express-sequelize/commit/435c061904ec534d4a3201730eb48c5e384be2b1))

## [6.3.6](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.5...v6.3.6) (2020-08-10)


### Bug Fixes

* prevent scopes validation crashes for conditions with boolean or number values ([#487](https://github.com/ForestAdmin/forest-express-sequelize/issues/487)) ([389f590](https://github.com/ForestAdmin/forest-express-sequelize/commit/389f590a89b59342afa2bce33cbe97e2f110a99f))

## [6.3.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.4...v6.3.5) (2020-08-05)


### Bug Fixes

* **related data:** fix related data display regression introduced in v6.3.3 ([#484](https://github.com/ForestAdmin/forest-express-sequelize/issues/484)) ([a585338](https://github.com/ForestAdmin/forest-express-sequelize/commit/a5853380952a6020308fae3a5d375096c6cfe8c7))

## [6.3.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.3...v6.3.4) (2020-08-05)


### Performance Improvements

* :zap: improve performance of queries on HasMany relationships ([#474](https://github.com/ForestAdmin/forest-express-sequelize/issues/474)) ([6e9c419](https://github.com/ForestAdmin/forest-express-sequelize/commit/6e9c4190849e1e52fc473038cc57c3480723b163))

## [6.3.3](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.2...v6.3.3) (2020-08-04)


### Bug Fixes

* **vulnerability:** patch a potential vulnerability updating forest-express to version 7.4.1 ([#481](https://github.com/ForestAdmin/forest-express-sequelize/issues/481)) ([d697f5e](https://github.com/ForestAdmin/forest-express-sequelize/commit/d697f5ed53cdae0f021020161add01690d8469cb))

## [6.3.2](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.1...v6.3.2) (2020-07-13)


### Bug Fixes

* **vulnerabilities:** bump 2 dependencies of dependencies ([#465](https://github.com/ForestAdmin/forest-express-sequelize/issues/465)) ([7bb23c0](https://github.com/ForestAdmin/forest-express-sequelize/commit/7bb23c00700dcfa85a1209b6c1bcc6488cab96fa))

## [6.3.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.3.0...v6.3.1) (2020-07-06)


### Bug Fixes

* **search:** return expected data on extended search on relations having string primary key ([#455](https://github.com/ForestAdmin/forest-express-sequelize/issues/455)) ([1fa13e8](https://github.com/ForestAdmin/forest-express-sequelize/commit/1fa13e8bd8cd5e3ba8adb8597d0308b8922af3ac))

# [6.3.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.2.1...v6.3.0) (2020-07-02)


### Features

* **filter:** is blank now also filter empty strings ([#458](https://github.com/ForestAdmin/forest-express-sequelize/issues/458)) ([d563942](https://github.com/ForestAdmin/forest-express-sequelize/commit/d563942781a0b7d644224b4b5483c7f4d39cc5ea))

## [6.2.1](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.2.0...v6.2.1) (2020-06-23)


### Bug Fixes

* **services:** create and expose records remover ([#452](https://github.com/ForestAdmin/forest-express-sequelize/issues/452)) ([bde6657](https://github.com/ForestAdmin/forest-express-sequelize/commit/bde6657a6153f2739352c1f079ba40f3036d7bee))

# [6.2.0](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.1.5...v6.2.0) (2020-06-02)


### Features

* **forest-express:** upgrade forest-express to 7.3.0 to add the scope validation feature [#442](https://github.com/ForestAdmin/forest-express-sequelize/issues/442) ([c3214aa](https://github.com/ForestAdmin/forest-express-sequelize/commit/c3214aaef68b9633bb2a8c0e60a26f30db48f14a))

## [6.1.5](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.1.4...v6.1.5) (2020-06-01)


### Bug Fixes

* **dependencies:** update babel to fix compilation error introduced by node lts 12.17.0 [#440](https://github.com/ForestAdmin/forest-express-sequelize/issues/440) ([9ec8501](https://github.com/ForestAdmin/forest-express-sequelize/commit/9ec8501fb220cf188152e8e5622b457e252e4adb))

## [6.1.4](https://github.com/ForestAdmin/forest-express-sequelize/compare/v6.1.3...v6.1.4) (2020-05-13)


### Bug Fixes

* **package:** publish on NPM with all the necessary code ([#430](https://github.com/ForestAdmin/forest-express-sequelize/issues/430)) ([8ad637a](https://github.com/ForestAdmin/forest-express-sequelize/commit/8ad637aafc67873494d52e2aeca149485ec0ded1))

## RELEASE 6.1.3 - 2020-05-12
### Changed
- Readme - Update the community badge.
- Readme - Fix interface screenshots display.
- Readme - Update and re-position the "How it works" section.
- Tests - Upgrade `sequelize-fixtures` dependency from 0.10.0 to 1.1.1

### Fixed
- Security - Patch newly detected vulnerabilities.

## RELEASE 6.1.2 - 2020-05-06
### Changed
- Technical - Patch CI configuration warnings.

### Fixed
- Schema - Fix array of enums detection.

## RELEASE 6.1.1 - 2020-04-27
### Fixed
- Composite Key - Fix composite key generation to handle UUID.

## RELEASE 6.1.0 - 2020-04-17
### Changed
- Technical - Make the CI lint the commit messages.
- Smart Action - Allow users to protect their smart action APIs against unauthorized usage.

## RELEASE 6.0.3 - 2020-04-14
### Changed
- Technical - Introduce conventional commits.
- Technical - Adapt release manager to conventional commits.

### Fixed
- Records Update - Collections having a "length" field can now have their record updated.

## RELEASE 6.0.2 - 2020-04-14
### Added
- Integrations - Allow user to choose custom mapping values for intercom integration.

## RELEASE 6.0.1 - 2020-04-06
### Fixed
- Security - Fix potential vulnerability upgrading `acorn` dependency.
- Technical - Unwrap default values in APIMap field builder.
- Integrations - Fix intercom conversations display with API v2.

## RELEASE 6.0.0 - 2020-03-17

## RELEASE 6.0.0-beta.0 - 2020-02-18
### Added
- Technical - Add optional chaining plugin to babel.
- Tests - Add MySQL min (5.6) and max (8.0) versions.
- Database Support - Add support for MySQL 8.
- Resource Deletion - Users can now bulk delete records.
- Technical - Add test and documentation for query-builder sort method.
- Smart Actions - Add a method to `RecordsGetter` to get all models IDs given a query or an ID list.

### Changed
- Technical - Upgrade to babel 7 stable.
- Initialisation - Make `Liana.init` return a promise resolving when all is up.

### Fixed
- Technical - Remove cognitive complexity in query-builder service.

## RELEASE 5.7.0 - 2020-01-22
### Added
- Has Many Relationships - Enable sorting on belongsTo relationship columns in related data.

### Fixed
- Technical - Ensure that all databases are initialized before running CI tests.
- Segment Live Query - Fix issue where an incorrect live query causes the server to crash.
- Login - Make the login error messages brought up to the end client through toasts more accurate.
- Schema - Schemas having fields with escaped characters are now properly saved as valid JSON.
- Security - Patch `set-value` dependency vulnerability.
- Security - Patch `tree-kill` devDependency vulnerability.

## RELEASE 5.6.0 - 2020-01-14
### Added
- Sessions - Distinguish "CORS configuration issue" and "Server down" scenarios in case of liana login error.

### Fixed
- Initialization - Filter out test files when requiring models (`__tests__/*`, `*.spec.js`, `*.spec.ts`, `*.test.js` or `*.test.ts`).

## RELEASE 5.5.0 - 2020-01-02
### Added
- Technical - Add SonarJS linter for complexity issues.

### Changed
- Smart Collections - Do not insert Smart Collections unless they contain at least one declared field.

### Fixed
- Intercom Integration - Better handling of automated messages.

## RELEASE 5.4.1 - 2019-12-11
### Changed
- Technical - Upgrade ESLint rules.
- Technical - Ensure that all files follow the ESLint rules.

### Fixed
- Logger - Improve formatting, add stack if present, do not display error messages twice.
- Smart actions - Ignore smart actions that do not have a name (display a warning).
- Export - Fix export on related data.

## RELEASE 5.4.0 - 2019-11-29
### Added
- Smart Relationship/Collection - Expose a serializer to simplify the serialization.

### Changed
- Technical - Rename `.env.example` file.

### Fixed
- Technical - Add vs code workspace to gitignore.

## RELEASE 5.3.0 - 2019-11-26
### Added
- Technical - `.forestadmin-schema` now keeps track of engine and framework names and versions.

### Fixed
- Schema - The `.forestadmin-schema.json` file is now written in the project directory, wherever the startup command has been hinted from.
- Smart Relationships - Prevent server crash in case of "cyclic" Smart BelongsTo declaration.

## RELEASE 5.2.1 - 2019-11-25
### Added
- Readme - Add the test coverage badge.

### Changed
- Technical - Extend lint check on script files.
- Technical - Use Jest instead of Mocha for the test base.

### Fixed
- Technical - Remove remaining traces of the lint command on specific files.
- Charts - Fix potential broken charts results if they are configured with filters.

## RELEASE 5.2.0 - 2019-11-18
### Added
- Routes - Expose the record services and the permissions middleware.

## RELEASE 5.1.0 - 2019-11-18
### Changed
- Technical - Add ESLint rules specific to tests.
- Technical - Filter parser is now asynchronous.
- Technical - Rename RecordsExporter to ResourceExporter to be consistent.
- Technical - Apply ESLint rules to `resource-updater`.
- Technical - Apply ESLint rules to `resources-exporter`.
- Technical - Apply ESLint rules to `src/services`.
- Technical - Remove continuous integration custom lint command.
- Technical - Rename RecordsExporter to ResourcesExporter in export.

### Fixed
- Smart Relationships - Smart Relationships returns referenced Smart Fields values.
- Error Handling - Fix error message when `configDir` does not exist.
- Error Handling - Prevent server to crash when Forest Admin API does not respond.
- Technical - Fix `before` hook in 2 tests to avoid timeout errors.

## RELEASE 5.0.0 - 2019-10-31
### Changed
- Technical - Remove useless `.jshintrc` file.

### Fixed
- NPM Publish - Do not send local environment variables on package publish.
- NPM Publish - Remove Github templates from the published packages.
- NPM Publish - Remove yarn errors log file from the published packages.
- Continuous Integration - Change `11.14` version of `node_js` to `lts/*` in `.travis.yml`.
- Routes - Ensure that admin middlewares are configured for admin API routes only and does not interfere with other project routes.

## RELEASE 4.0.2 - 2019-10-10
### Fixed
- Initialization - Fix a bad behaviour that removes all admin API routes if the liana init is called more than once.

## RELEASE 4.0.1 - 2019-10-09
### Changed
- Technical - Upgrade to the `forest-express` v4 public dependency.
- Technical - Apply eslint rules to `has-many-dissociator`.
- Technical - Apply eslint rules to `resource-remover`.

### Fixed
- Has Many - Fix delete from has many when primary key is not `id`.

## RELEASE 4.0.0 - 2019-10-04
### Added
- Technical - A Release now also automatically publish the release note to Slack.

### Fixed
- Filters - Fix filters on references having a primary key column name different than the model field name.

## RELEASE 4.0.0-beta.10 - 2019-09-26
### Changed
- Technical - Make the stats code more consistent.

### Fixed
- List Records - Search on table with uuidv1 or v4 does not crash.
- Value Charts - Fix aggregate on a field with custom column name.

## RELEASE 4.0.0-beta.9 - 2019-09-18
### Changed
- Technical - Improve tests descriptions.

### Fixed
- Filters - Fix filtering on references fields that have an unconventional column name.

## RELEASE 4.0.0-beta.8 - 2019-09-11
### Fixed
- Resources Getter - Prevent API crash if the sorting field is a reference field that is not among the displayed columns.

## RELEASE 4.0.0-beta.7 - 2019-08-23
## RELEASE 4.0.0-beta.6 - 2019-08-23
### Fixed
- Charts - Fix charts with previous interval.

## RELEASE 4.0.0-beta.5 - 2019-08-22
### Changed
- Technical - Apply ESLint rules.

### Fixed
- Has Many - Fix an internal error if a search is done on a page different that the first one and the search returns no results.

## RELEASE 4.0.0-beta.4 - 2019-08-12
### Fixed
- Filters - Fix filters `was in previous xxx` issue due to moment mutability.

### Changed
- Technical - Make filters date operator parser generic through forest-express.

## RELEASE 4.0.0-beta.3 - 2019-08-02
### Fixed
- Error Handling - Fix error handling crash trial 2.

## RELEASE 4.0.0-beta.2 - 2019-08-02
### Fixed
- Error Handling - Fix error handling crash (regression introduced in 4.0.0-beta.0).

## RELEASE 4.0.0-beta.1 - 2019-08-01
### Changed
- Technical - Makes the JWT lighter and consistent across lianas.

## RELEASE 4.0.0-beta.0 - 2019-08-01
### Changed
- Filters - Add support for complex/generic conditions chaining.

### Fixed
- Technical - Fix pre-commit hook to avoid renamed file and add new line at the end of the file.
- Technical - Set default prerelease tag to beta if nothing specified on deploy.

## RELEASE 3.3.5 - 2019-09-26
### Changed
- Technical - Make the stats code more consistent.

### Fixed
- Value Charts - Fix aggregate on a field with custom column name.

## RELEASE 3.3.4 - 2019-09-05
### Fixed
- List Records - Search on table with uuidv1 or v4 does not crash.

## RELEASE 3.3.3 - 2019-08-22
### Fixed
- Serializer - Fix serialization of records with id 0.

## RELEASE 3.3.2 - 2019-08-22
### Fixed
- Pie Charts - Fix capability to have a chart grouped by a reference field with an alias.

## RELEASE 3.3.1 - 2019-08-22
### Added
- Readme - Add a badge for the NPM package version.

### Changed
- Readme - Add a community section.
- Readme - Remove the Licence section as it is already accessible in the Github page header.
- Readme - Fix the CI badge.

### Fixed
- Pie Chart - Fix groupBy/aggregate on a field with custom column name.
- Time Chart - Fix groupBy/aggregate on a field with custom column name.
- Leaderboard Chart - Fix groupBy on a field with custom column name.
- List Records - Fix sort on a belongsTo association having a reference field with custom column name.
- List Related Records - Fix sort on a field with custom column name.

## RELEASE 3.3.0 - 2019-08-07
### Added
- Field Types - Define properly the type of `UUIDV1` and `UUIDV4` fields in the schema.

### Fixed
- Technical - Fix pre-commit hook to avoid renamed file and add new lina at the end of the file.
- Technical - Apply ESLint rules to `has-many-getter` and `query-builder`.

## RELEASE 3.2.6 - 2019-07-24
### Fixed
- Schema - Schemas having fields with descriptions containing "\n" are now properly sent in remote environments.

## RELEASE 3.2.5 - 2019-07-23
### Fixed
- Smart Actions - Automatically add the "/" character if missing at the beginning at a Smart Action custom endpoint declaration.

## RELEASE 3.2.4 - 2019-07-16
### Changed
- Naming - Rename opts to options in stat getters.
- Technical - Apply ESLint rules to old files.

### Fixed
- Security - Upgrade `lodash` dependency for security patch.
- Security - Upgrade `onchange` dependency for security patch.
- Security - Upgrade `sequelize` dev dependency for security patch.

## RELEASE 3.2.3 - 2019-06-21
### Fixed
- Filters - Fix potential chart / records retrieval errors (Regression introduced in v3.2.2).

## RELEASE 3.2.2 - 2019-06-20
### Changed
- Technical - Apply ESLint rules to some files.

### Fixed
- Schema - Schemas having fields with validations based on complex regex are now properly sent in remote environments.

## RELEASE 3.2.1 - 2019-06-18
### Fixed
- Validations - Fix the regexp content transmission for "is like" validations.

## RELEASE 3.2.0 - 2019-06-17
### Added
- Configuration - The liana now requires recursively model files in `modelsDir` and customization files in `configDir`.

### Changed
- Technical - Apply ESLint rules to an old code.

## RELEASE 3.1.1 - 2019-05-15
### Fixed
- Exports - Fix broken exports if users restart a new browser session (ie quit/restart browser).

## RELEASE 3.1.0 - 2019-04-23
### Fixed
- Security - Patch a vulnerability using the latest `mocha` dependency.

### Changed
- Dependency - Upgrade the forest-express dependency for onlyCrudModule option.

## RELEASE 3.0.0 - 2019-04-22
### Changes
- CI - Update NodeJS version to v11.14.0 for Travis.
- Technical - Update yarn.lock.

## RELEASE 3.0.0-beta.13 - 2019-04-18
### Fixed
- Schema Synchronisation - `FOREST_DISABLE_AUTO_SCHEMA_APPLY=true` now deactivates properly the automatic schema synchronisation on server start.

## RELEASE 3.0.0-beta.12 - 2019-04-17
### Changes
- Technical - Use the latest `onchange` dependency.

### Fixed
- Security - Patch vulnerabilities removing the unused `nsp` dependency.
- Security - Patch vulnerabilities removing the unused `gulp` dependency.
- Security - Patch vulnerabilities using the latest `eslint` dependency.
- Security - Patch vulnerabilities using the latest `babel` dependencies.
- Security - Patch vulnerabilities using the latest `mocha` dependency.
- Security - Patch vulnerabilities using the latest `sequelize` dependency.
- Security - Patch vulnerabilities using the latest `sequelize-fixtures` dependency.
- Security - Patch vulnerabilities using the latest `pg` dependency.
- Security - Patch vulnerabilities using the latest `forest-express` dependency.
- Security - Patch a vulnerability using the latest `lodash` dependency.

## RELEASE 3.0.0-beta.11 - 2019-04-01
### Fixed
- Sequelize - Support new Sequelize version 5.

## RELEASE 3.0.0-beta.10 - 2019-03-29
### Fixed
- Authentication - Fix the 2FA authentication with the new implementation of exports authentication.

## RELEASE 3.0.0-beta.9 - 2019-03-28
### Fixed
- Technical - Fix the latest built version.

## RELEASE 3.0.0-beta.8 - 2019-03-28
### Changed
- Build - Improve build script for beta versions.

### Fixed
- Security - Fix implementation of session token passed in headers while downloading collections records.

## RELEASE 3.0.0-beta.7 - 2019-03-27
### Changed
- Security - Do not pass session token in query params while downloading collections records.

## RELEASE 3.0.0-beta.6 - 2019-02-18
### Fixed
- Actions - Fix default action route generation if the action name contains camelcase words.

## RELEASE 3.0.0-beta.5 - 2019-02-17
### Fixed
- Integrations - Fix Stripe global payments list display.

## RELEASE 3.0.0-beta.4 - 2019-02-15
### Fixed
- Build - Republish the beta version on the beta tag.

## RELEASE 3.0.0-beta.3 - 2019-02-08
### Changed
- Technical - In development environment, ensure that the schema send has the exact same data and format like with the toolbelt.

## RELEASE 3.0.0-beta.2 - 2019-01-28
### Fixed
- Schema - Fix JSON formatting for action names containing `"` characters.
- Schema - The liana can now read properly the schema file in production mode.

## RELEASE 3.0.0-beta.1 - 2019-01-28
### Added
- Build - Tag versions on git for each release.
- Build - Developers can now create beta versions.
- Developer Experience - On start, create a `.forestadmin-schema.json` file that contains the schema definition.
- Developer Experience - On production, load `.forestadmin-schema.json` for schema update.
- Developer Experience - Developers can deactivate the automatic schema synchronisation on server start using the `FOREST_DISABLE_AUTO_SCHEMA_APPLY` environment variable.

## RELEASE 2.17.2 - 2019-02-17
### Fixed
- Integrations - Fix Stripe global payments list display.

## RELEASE 2.17.1 - 2019-02-15
### Fixed
- Build - Republish the regular version on the latest tag.

## RELEASE 2.17.0 - 2019-01-21
### Added
- Technical - Add babel.
- Configuration - Developers can define a blacklist or whitelist of models they want to see in their admin panel (using `includedModels` or `excludedModels` options).

## RELEASE 2.16.9 - 2018-11-08
### Changed
- Smart Fields - Display a warning to show Smart Fields declared without a field attribute.

### Fixed
- Smart Fields - Smart Fields declared without a field attribute are not sent in the Apimap anymore.

## RELEASE 2.16.8 - 2018-11-08
### Fixed
- Validations - Fix bad "is longer than" validation definition in the Apimap for `len` validation if the minimal value is 0 (for instance, `len: [0, 255]`).

## RELEASE 2.16.7 - 2018-10-30
### Fixed
- API - Prevent Apimaps from having duplicate fields, segments and actions, if the developer call the init function multiple times.

## RELEASE 2.16.6 - 2018-10-26
### Changed
- Technical - Light changes in associations code for readability.

### Fixed
- Associations - Fix error on related data search if no record is found. [Regression introduced in 2.16.2]

## RELEASE 2.16.5 - 2018-10-26
### Fixed
- Associations - Fix limit and offset of the query getting has many associations.

## RELEASE 2.16.4 - 2018-10-22
### Fixed
- Live Query Segments - Live Query segments work if the related collection primary key is not named "id" and select return "id".
- Default Values - UUID fields with a dynamic default value won't be pre-filled with "[object Object]" in forms anymore.

## RELEASE 2.16.3 - 2018-10-12
### Fixed
- Live Query Segments - Live Query segments work if the related collection primary key is not named "id".
- Server start - Fix a crash if developers add a Smart Action to a generated integration collection that does not have existing one by default.

## RELEASE 2.16.2 - 2018-10-01
### Changed
- List Related Records - Improve the speed of the search query.
- List Related Records - Improve the speed of counting records.

### Fixed
- List Related Records - Fix count of related records when relation is ManyToMany with an alias.

## RELEASE 2.16.1 - 2018-09-24
### Changed
- Authentication - Improve the log message when 2FA secret key is not set.

### Fixed
- Authentication - Fix an empty user id attribute in the JWT tokens.

## RELEASE 2.16.0 - 2018-09-08
### Added
- Integrations - Developers can add Smart Actions to Integration Collections.

## RELEASE 2.15.6 - 2018-09-05
### Fixed
- Search - Fix searches that contains special characters.

## RELEASE 2.15.5 - 2018-09-04
### Fixed
- Search - Fix searches that start with the "+" character.

## RELEASE 2.15.4 - 2018-08-29
### Fixed
- Technical - Add the missing "babel-runtime" dependency.

## RELEASE 2.15.3 - 2018-08-29
### Fixed
- Search - Fix potential bad results while searching on collections having Smart Fields custom searches.

## RELEASE 2.15.2 - 2018-08-29
### Fixed
- Search - Fix the extended search results if the collection does not contain displayed associations.

## RELEASE 2.15.1 - 2018-08-29
### Fixed
- Search - Fix the extended search results if the collection does not contain searchable fields.

## RELEASE 2.15.0 - 2018-08-28
### Added
- Authentication - Add two factor authentication using time-based one-time password.

### Changed
- Records Deletion - The deletion of a record which has already been deleted does not display an error anymore.

## RELEASE 2.14.1 - 2018-08-06
### Fixed
- Smart Actions - Fix Smart Actions Forms fields positions on Smart Collections.

## RELEASE 2.14.0 - 2018-07-18
### Changed
- Performance - Improve the speed of listing the records by executing their count into another request.

### Fixed
- Records List - Fix the list display of "native" collections that don't have any primary keys or a column named "id".

## RELEASE 2.13.1 - 2018-07-11
### Fixed
- Mixpanel Integration - Only retrieve events that are less than 60 days old to be compliant with the Mixpanel's API.

## RELEASE 2.13.0 - 2018-07-10
### Changed
- Mixpanel Integration - Change the integration to display the last 100 Mixpanel events of a "user" record.
- Mixpanel Integration - Remove the Mixpanel integration pre-defined segments.

## RELEASE 2.12.8 - 2018-06-29
### Fixed
- Charts - Fix leaderboard charts on models having several belongsTo targeting the same model.
- Smart Fields - Always pass a Sequelize instance as the first parameter of the Smart Field value getter functions.

## RELEASE 2.12.7 - 2018-06-27
### Changed
- Associations - Deactivate the records validations on hasMany association to prevent unexpected validation error (see https://github.com/sequelize/sequelize/issues/9559).

## RELEASE 2.12.6 - 2018-06-27
### Changed
- Intercom Integration - Display the Intercom error in the server logs if the conversations list retrieval fails.

### Fixed
- Intercom Integration - Users can now access to the Intercom Details page.
- Intercom Integration - Fix the integration routes for projects using the "expressParentApp" configuration.

## RELEASE 2.12.5 - 2018-06-27
### Fixed
- Records Update - Allow model hooks to change fields values while updating a belongsTo or hasOne association.

## RELEASE 2.12.4 - 2018-06-22
### Fixed
- Related Data - Fix the related data retrieval if the foreignKey has been specified. [regression introduced in 2.11.3]

## RELEASE 2.12.3 - 2018-06-21
### Fixed
- Permissions - Fix automated permission for projects having multiple teams.

## RELEASE 2.12.2 - 2018-06-18
### Fixed
- Records Creation - Prevent associations defined while creating a new record from overwriting associations created by hooks. [regression introduced in 2.1.1]
- Records List - Fix a regression on records ordering due to Lodash dependency upgrade. [Regression introduced in 2.8.5]

## RELEASE 2.12.1 - 2018-06-17
### Fixed
- DateOnly Fields - Fix potential bad values for projects using Sequelize 4+.
- Pie Charts - Fix potential bad "dateonly" values for projects using Sequelize 4+.

## RELEASE 2.12.0 - 2018-06-14
### Added
- Charts - Users can create "Leaderboard" charts.
- Charts - Users can create "Objective" charts.
- Technical - Add a new apimap property "relationship".

## RELEASE 2.11.3 - 2018-06-14
### Changed
- Performance - Make the related data count retrieval much more efficient if the result contains thousands of records.

## RELEASE 2.11.2 - 2018-06-07
### Fixed
- IP Whitelist - Fix broken ip range of form 'x.x.x.x - x.x.x.x'.

## RELEASE 2.11.1 - 2018-06-04
### Changed
- Validation - On create or update, Record validation errors will now return a 422 status code (instead of 500).

### Fixed
- Technical - Cleanup the dependencies.

## RELEASE 2.11.0 - 2018-06-01
### Added
- Segments - Users can create segments with SQL queries.

## RELEASE 2.10.0 - 2018-05-31
### Added
- Permissions - Add a permission mechanism to protect the data accordingly to the UI configuration.

### Fixed
- Smart Actions - Fix form values prefill on Smart Actions having a custom endpoint.

## RELEASE 2.9.0 - 2018-05-25
### Added
- Search - Display highlighted matches on table view when searching.

### Fixed
- Search - Fix the search on Enum fields.
- Search - Return empty result instead of the whole list of records if no field can be searched on the collection.

## RELEASE 2.8.7 - 2018-05-18
### Fixed
- Search - Fix potential broken search on collections that have been customized before the liana.init call.

## RELEASE 2.8.6 - 2018-05-11
### Fixed
- Related Data - Fix a regression on related data access due to Lodash dependency upgrade. [Regression introduced in 2.8.5]

## RELEASE 2.8.5 - 2018-05-11
### Fixed
- Security - Upgrade the Lodash dependency for security reasons (https://nodesecurity.io/advisories/577).
- Stripe Integration - Improve global error handling if the stripe id is missing or incorrect in the database

## RELEASE 2.8.4 - 2018-04-30
### Fixed
- Collections - Allow search fields customization before liana initialization.

## RELEASE 2.8.3 - 2018-04-25
### Fixed
- Default Values - Fix the prefilled value in creation/update forms on DateOnly fields having Sequelize.NOW default value.

## RELEASE 2.8.2 - 2018-04-25
### Fixed
- Premium Security - Handle mutli instances ip whitelist refresh.

## RELEASE 2.8.1 - 2018-04-17
### Changed
- Technical - Update yarn.lock.

## RELEASE 2.8.0 - 2018-04-17
### Added
- Premium Security - Add IP Whitelist feature.

## RELEASE 2.7.1 - 2018-04-12
### Fixed
- Smart Relationships - Make the Smart BelongsTo work when it references a Smart Collection record.

## RELEASE 2.7.0 - 2018-03-30
### Added
- Related Data - Delete records directly from a hasMany listing.

## RELEASE 2.6.1 - 2018-03-30
### Fixed
- Integration - Prevent client console error on Close.io leads failed retrieval.

## RELEASE 2.6.0 - 2018-03-29
### Added
- Smart Actions - "Single" type Smart Action forms can now be prefilled with contextual values.

## RELEASE 2.5.9 - 2018-03-27
### Fixed
- Authentication - Fix the missing email/name/teams information set in the token for user using Google SSO.
- Default Values - Fix the prefilled value in creation/update forms on Date fields having Sequelize.NOW default value.
- Default Values - Make the record creation possible if some fields of the model have a default value function.

## RELEASE 2.5.8 - 2018-03-26
### Changed
- Collections - Allow collection customization before liana initialization.

### Fixed
- Live Query - Replace all occurences of the special character '?' in the Live Query mode.

## RELEASE 2.5.7 - 2018-03-21
### Fixed
- Smart Fields - Boolean Smart Fields that return a "false" value are now properly sent though the API.

## RELEASE 2.5.6 - 2018-03-13
### Changed
- Security - Fix low impact vulnerabilities.

### Fixed
- Technical - Use local packages for npm scripts.
- Smart Elements - Fix error swallowing on start.

## RELEASE 2.5.5 - 2018-03-12
### Added
- Smart Actions - Developers can define Smart Actions that can send their request to a different endpoint than the current environment endpoint.

## RELEASE 2.5.4 - 2018-03-08
### Fixed
- Close.io Integration - Send a "No Content" (204) status code if not customer lead has been found instead of an "Internal Server Error" (500).

## RELEASE 2.5.3 - 2018-03-07
### Changed
- Smart Fields - Display a warning if an error occurs during Smart Field value computations.

## RELEASE 2.5.2 - 2018-03-06
### Fixed
- Filters - Fix the "is not" operator behaviour on Boolean fields.

## RELEASE 2.5.1 - 2018-03-05
### Fixed
- Live Query - Fix charts generation for values equal to 0 or null.

## RELEASE 2.5.0 - 2018-03-01
### Added
- Smart Actions - Users can define Smart Actions only available in a record detail.

## RELEASE 2.4.4 - 2018-02-28
### Changed
- Apimap - Catch potential failure during the apimap sorting.

### Fixed
- Smart Actions - Display the Smart Actions form fields in the declaration order. [Regression introduced in 2.4.0]

## RELEASE 2.4.3 - 2018-02-21
### Added
- Filters - Add a new "is after X hours ago" operator to filter on date fields.

## RELEASE 2.4.2 - 2018-02-09
### Fixed
- Search - Prevent potential extended search errors if the collection has belongsTo associations to collections having Smart Fields.

## RELEASE 2.4.1 - 2018-02-08
### Fixed
- Live Queries - Prevent the execution of obvious "write" queries.
- Live Queries - Prevent the execution of multiple queries.

## RELEASE 2.4.0 - 2018-02-07
### Changed
- Apimap - Prevent random sorting collections and useless updates.

### Fixed
- Search - Prevent the records search to crash if no fields parameter is sent by the client.

## RELEASE 2.3.1 - 2018-02-02
### Fixed
- Charts - Fix the missing variation value for Value Charts computed with a specific period filter. [regression introduced in 2.2.3]

## RELEASE 2.3.0 - 2018-02-02
### Changed
- Smart Fields - Compute only the necessary Smart Fields values for list views and CSV exports.

## RELEASE 2.2.6 - 2018-02-01
### Fixed
- Smart Fields - Fix concurrency between Smart Fields setters and enable multiple setters to work properly on a record update.

## RELEASE 2.2.5 - 2018-02-01
### Fixed
- Security - Fix the usage of new Sequelize Operators in list views for a reinforced security.

## RELEASE 2.2.4 - 2018-02-01
### Fixed
- CORS - Re-authorize forestadmin.com in the CORS configuration. [regression introduced in 2.0.4]

## RELEASE 2.2.3 - 2018-01-30
### Fixed
- Security - Fix the usage of new Sequelize Operators in list views for a reinforced security.

## RELEASE 2.2.2 - 2018-01-30
### Fixed
- Security - Fix the condition to use new Sequelize Operators for a reinforced security.

## RELEASE 2.2.1 - 2018-01-29
### Changed
- Security - Support new Sequelize Operators for a reinforced security.

## RELEASE 2.2.0 - 2018-01-26
### Added
- Charts - Users can create charts using raw database queries with the Live Query option.

## RELEASE 2.1.1 - 2018-01-23
### Fixed
- Creation - Fix broken "hasOne" associations defined while creating a new record.

## RELEASE 2.1.0 - 2018-01-11
### Added
- Authentication - Users can connect to their project using Google Single Sign-On.

## RELEASE 2.0.4 - 2017-12-27
### Changed
- Performance - Reduce drastically the number of CORS preflight requests send by the API clients.

### Fixed
- Authentication - Developers whom want to extend the Admin API can now use the authentication for the overridden routes.

## RELEASE 2.0.3 - 2017-12-22
### Added
- Smart BelongsTo - Developers can now implement Smart BelongsTo values updates.
- Smart Fields - Add a "isFilterable" option to let them appear in the filters selection.

### Fixed
- Smart Fields - Prevent Smart Fields promise values injection errors on related data retrieval.
- Security - Remove a vulnerability by upgrading Moment.js library.

## RELEASE 2.0.2 - 2017-12-12
### Added
- TypeScript Support - Forest can now load TypeScript modules.

### Fixed
- Smart Fields - Prevent Smart Fields values injection errors on related data retrieval.

## RELEASE 2.0.1 - 2017-12-06
### Fixed
- Summary View - Fix potential Summary View freeze on records having "Point" type fields (if some related data are displayed).

## RELEASE 2.0.0 - 2017-11-30
### Changed
- Collections Names - Collection names are now based on the model name.

## RELEASE 1.5.6 - 2017-11-27
### Added
 - Stripe Integration - Allow users to display Stripe records in the Details view.

## RELEASE 1.5.5 - 2017-11-20
### Changed
- Apimap - Do not send fields with an unknown type in the Apimap anymore. 🛡

### Fixed
- Database Info - Send the database dialect in the Apimap metadata.
- Charts - Fix some bad Line charts aggregation due to Daylight Saving Time.

## RELEASE 1.5.4 - 2017-11-13
### Fixed
- Validations - Allow an array with one value to define minimum value length validation.

## RELEASE 1.5.3 - 2017-11-08
### Fixed
- Custom Domains - Make the feature usable natively with the CORS_ORIGINS variable.

## RELEASE 1.5.2 - 2017-11-06
### Changed
- Security - Remove all detected vulnerabilities upgrading some dependencies (nsp check --output summary).
- Performance - Improve MSSQL search performances (MSSQL Search is case insensitive).

## RELEASE 1.5.1 - 2017-10-30
### Changed
- Smart Fields - Do the Smart Fields values injection in the Serializer to simplify Smart Relationships implementation.

### Fixed
- Search - Fix a regression on UUID fields search. 🛡
- Search - An extended search on a belongsTo associated model with an UUID value will not crash anymore. 🛡
- HasMany Dissociation - Catch SQL constraints errors on record dissociation.

## RELEASE 1.5.0 - 2017-10-26
### Added
- Types Support - Support Point field type.

### Changed
- Smart Relationships - Add a warning if a Smart Collection does not define the "idField" attribute necessary for Smart Relationships.
- Smart Fields - Prevent the Smart Fields computation errors to generate a crash and handle it letting the value empty.

## RELEASE 1.4.8 - 2017-10-20
### Fixed
- Line Charts - Fix Line Charts potential crash on Postgresql databases.
- Search - Fix the regression of the searchFields option.

## RELEASE 1.4.7 - 2017-10-18
### Fixed
- Charts - Fix one-relationship filters for projects with collections names different than the filter field name send in the request.

## RELEASE 1.4.6 - 2017-10-11
### Changed
- Sessions - Display a clean error message if the renderingId and envSecret are missing or inconsistent.

### Fixed
- Initialisation - Prevent bad "import" syntax error detections on initialisation.

## RELEASE 1.4.5 - 2017-10-06
### Fixed
- Stripe - Fix the 'mapping' collection name on Express/Mongoose.
- Integrations - Ensure all the models are loading before integrations setup.

## RELEASE 1.4.4 - 2017-10-04
### Fixed
- Initialisation - Do not try to require file that don't have the js extension.

## RELEASE 1.4.3 - 2017-10-03
### Fixed
- Intercom - Make the conversation details accessible.

## RELEASE 1.4.2 - 2017-10-02
### Fixed
- Initialisation - Prevent bad ES2017 syntax error detections on initialisation.

## RELEASE 1.4.1 - 2017-10-02
### Fixed
- Initialization - Fix the init phase when sequelize option is not present.

### Changed
- Intercom Integration - Prefer Intercom accessToken configuration to old fashioned appId/apiKey.
- Intercom Integration - Remove support for old configuration parameter use "userCollection" (use mapping instead).

## RELEASE 1.4.0 - 2017-09-20
### Added
- Line Charts - Support SQLite dialect for groupBy fields.
- Smart Fields - Add a parameter to specify if the sorting is allowed on this field.

### Fixed
- Resource Retrieval - Fix the record retrieval for a record having no belongsTo/hasOne for projects using Sequelize 4.8.x.
- Charts - Fix broken charts if they contain relationship filters on model fields that have a different column name.
- Initialization - Ignore directories while loading models.

## RELEASE 1.3.6 - 2017-09-10
### Changed
- Initialization - Display an explicit error log if a model cannot be loaded properly.

### Fixed
- Pie Charts - Prevent a potential crash on models having a column named "key".

## RELEASE 1.3.5 - 2017-09-08
### Fixed
- Composite Primary Keys - prevent crash with null values.

## RELEASE 1.3.4 - 2017-09-07
### Fixed
- Export - Fix datetime formatting regression introduced by liana version 1.3.0.

## RELEASE 1.3.3 - 2017-08-31
### Fixed
- HasMany Display - Fix HasMany association display for models having a composite primary key.
- Export CSV - Fix HasMany association export for models having a composite primary key.
- Search - Fix a potential search regression due to multi database support (1.3.0).
- Charts Line - Fix the MySQL detection regression.

## RELEASE 1.3.2 - 2017-08-30
### Added
- Integrations - Add the Layer integration.

## RELEASE 1.3.1 - 2017-08-30
### Added
- Resources Route - Allow users to call a ResourcesRoute from their app.

### Fixed
- Apimap - Fix collections schema for collections having snakecase foreign keys.

## RELEASE 1.3.0 - 2017-08-29
### Added
- Onboarding - Display an error message if the envSecret option is missing.
- Databases Connections - Support multiple databases connections.

### Fixed
- Code Inspection - Fix Forest customization code inspection to be recursive through directories.
- Exports - Escape special characters for the string fields.
- Integrations - Display models "mapping" errors if any.

## RELEASE 1.2.1 - 2017-08-23
### Fixed
- Exports - Fix bad initial implementation for exports authentication.

## RELEASE 1.2.0 - 2017-08-21
### Added
- Exports - Forest can now handle large data exports.

### Fixed
- Record Creations - Prevent issue on record creations for models with UUID primary key default value.

## RELEASE 1.1.17 - 2017-08-09
### Added
- Integrations - Add a first version of Layer integration.

## RELEASE 1.1.16 - 2017-08-08
### Added
- Validations - Start the support of forms validations (with 9 first validations).
- Fields - Send the defaultValue for creation forms.
- Search - Split "simple" and "deep" search features with a new param.

## RELEASE 1.1.15 - 2017-07-31
### Fixed
- Sorting - Fix the sorting issue on the primary keys for MSSQL projects (bad fix on the previous version).

## RELEASE 1.1.14 - 2017-07-31
### Fixed
- Sorting - Fix the sorting issue on the primary keys for MSSQL projects.

## RELEASE 1.1.13 - 2017-07-12
### Fixed
- Records Update - Prevent a crash on record updates for records that have no attributes.

## RELEASE 1.1.12 - 2017-07-11
### Added
- Search - Users can search on the hasMany associated data of a specific record.
- Technical - Setup the continuous integrations configuration for Travis CI.

### Fixed
- Filters - Boolean filter condition with a null value will not crash anymore.

## RELEASE 1.1.11 - 2017-07-05
### Added
- Search - Developers can configure in which fields the search will be executed.

### Changed
- Search - Remove some useless conditions to improve performance (id = 0).

## RELEASE 1.1.10 - 2017-07-05
### Added
- Filters - Add the before x hours operator.

### Changed
- Technical - Support Sequelize 4.2.0.

### Fixed
- Record Deletions - Handle the record deletion on models having a composite primary key.
- Liana Version & Orm Version - Prevent server crash on bad format version.
- Apimaps - Prevent foreign key field creation for belongsTo associations having a constraints set to false.

## RELEASE 1.1.9 - 2017-06-28
### Fixed
- Resources Getter - Support MSSQL records list retrieval without order in the query.

## RELEASE 1.1.8 - 2017-06-23
### Added
- Apimap - Send database type and orm version in apimap.

### Fixed
- Pie Charts - Support MSSQL dialect for "Manual" Pie charts.
- Line Charts - Support MSSQL dialect for "Manual" Line charts.

## RELEASE 1.1.7 - 2017-06-13
### Changed
- Error Messages - Display the stack trace on unexpected errors.

### Fixed
- Error Messages - Display an explicit warning if Forest servers are in maintenance.

## RELEASE 1.1.6 - 2017-06-07
### Fixed
- Records Serialization - Fix the object types case (kebab case) to prevent potential JSON api adapter errors on client side.
- Charts - Fix a regression on Count Charts for MySQL apps since liana version 1.1.3.

## RELEASE 1.1.5 - 2017-06-01
### Fixed
- HasMany Smart Fields - Fix routes conflicts between hasMany Smart Fields and other associations.

## RELEASE 1.1.4 - 2017-05-30
### Added
- Smart Collections - Add a new isSearchable property to display the search bar for Smart Collections.
- Filters - Add the not contains operator.

## RELEASE 1.1.3 - 2017-05-24
### Added
- Composite Keys - Support composite primary keys.
- Types Support - Support BIGINT field type.

### Fixed
- HasMany ListViews - Fix the display of hasMany records for a model having a primaryKey that is not an "id" column and that has the related column hidden in the hasMany list view.
- HasMany ListViews - Smart Fields computed with other record attributes are now properly displayed even if the related record attributes have their columns hidden in the list view.
- Smart Fields - Serialize Smart Fields values for hasMany associations.

## RELEASE 1.1.2 - 2017-05-11
### Added
- Customization Errors - Do not send the apimap when users create Forest customization with syntax errors in code.
- Customization Errors - Add errors in the console when users create Forest customization with syntax errors in code.

### Fixed
- Smart Fields - Serialize Smart Fields values for belongsTo association.
- HasOne Associations - Users can now update records with hasOne associations.
- List Views - Smart Fields computed with other record attributes are now properly displayed even if the related record attributes have their columns hidden in the list view.
- Smart Fields - A Smart Field used as a reference field is now displayed properly in the search results of a belongsTo field.

## RELEASE 1.1.1 - 2017-05-04
### Added
- Smart Fields - Add an explicit error message if the search on a Smart Field generates an error.

### Fixed
- Smart Fields - A search on a collection having Smart Fields with search method implemented will respond properly (bypassing failing Smart Fields search if any).

## RELEASE 1.1.0 - 2017-04-27
### Added
- Smart Fields - Developers can now define Smart Fields setters.

### Changed
- Smart Fields - Replace the Smart Fields value method by get.

## RELEASE 1.0.12 - 2017-04-21
### Fixed
- Filters ToDate - Fix the end of period filtering for "toDate" date operator types.
- Smart Fields - Smart fields are sent in the detail view request.
- Time-based chart - Ensure the groupBy is always valid.

## RELEASE 1.0.11 - 2017-04-14
### Added
- Setup Guide - Add integration field to the collections to distinguish Smart Collections and Collections from integrations.

### Fixed
- Search - Fix the search on UUID type columns that are not a primary key.

## RELEASE 1.0.10 - 2017-04-06
### Added
- Version Warning - Display a warning message if the liana version used is too old.
- Types Support - Support Dateonly field type.

## RELEASE 1.0.9 - 2017-03-30
### Added
- Smart Actions - Users don't have to select records to use a smart action through the global option.

## RELEASE 1.0.8 - 2017-03-23
### Fixed
- Sorting - Fix records retrieval with a sort on an association field.

## RELEASE 1.0.7 - 2017-03-23
### Fixed
- Record Getter - Prevent issues on models that have overriden the "toJSON" method.

## RELEASE 1.0.6 - 2017-03-16
### Added
- Search - Primary key string fields are now searchable.

### Fixed
- Pie Charts - Fix Pie Charts having a groupBy on a belongsTo/hasOne relationship.
- Record Getter - Prevent an unexpected error if the record does not exist.

## RELEASE 1.0.5 - 2017-03-14
### Added
- Types Support - Support CITEXT field type.

## RELEASE 1.0.4 - 2017-03-10
### Added
- Configuration - Display an error message if the Smart Action "fields" option is not an Array.

## RELEASE 1.0.3 - 2017-03-10
### Changed
- Models - The sequelize db option is now optional.

## RELEASE 1.0.2 - 2017-02-24
### Fixed
- Filters - Fix filters regression on belongsTo associations (due to Boolean support for MySQL).

## RELEASE 1.0.1 - 2017-02-10
### Fixed
- Filters - Fix filters on boolean fields using MySQL databases.
- Record Creation - Fix the record creation with many-to-many associations.

## RELEASE 1.0.0 - 2016-02-06
### Added
- Smart Actions - Support file download.

## RELEASE 0.5.5 - 2016-01-24
### Added
- Types Support - Support JSON field type (and behaves exactly like JSONB).

## RELEASE 0.5.4 - 2016-01-04
### Fixed
- Smart segment - Smart segment are now correctly updated.

## RELEASE 0.5.3 - 2016-12-14
### Fixed
- Line Chart - Fix ambiguous groupBy field for MySQL databases.

## RELEASE 0.5.2 - 2016-12-13
### Fixed
- Relationships - Fix the retrieval of a record when a scope is applied on a relationship.

## RELEASE 0.5.1 - 2016-12-12
### Fixed
- Line Charts - Fix a regression displaying some bad values in specific line charts.

## RELEASE 0.5.0 - 2016-12-12
### Added
- Segments - Smart Segments can be created to define specific records subsets.

### Changed
- Package - Add contributors, keywords, homepage...
- Package - Remove all unused packages.
- Dependencies - Freeze the dependencies versions to reduce packages versions changes between projects/environments.
- Configuration - Rename secret values to envSecret and authSecret.
- Installation - envSecret and authSecret are now defined in environment variables and, thus, in all non-development environments, need to be set manually.

### Fixed
- Search - Fix search requests on associated collections having different fields names from database columns names.

## RELEASE 0.4.5 - 2016-12-05
### Added
- Date Filters - Date filters operators are now based on the client timezone.

### Changed
- Packages - Remove useless node-uuid package.

### Fixed
- Pie Charts - Fix potential ambiguous groupBy field name.
- Search - Fix broken search on collections with associations using UUID primary keys.

## RELEASE 0.4.4 - 2016-11-25
### Added
- Chart Filters - Support chart filters on belongsTo associations.
- Pie Charts - Support group by on belongsTo associations.
- Deserialization - Expose the Deserialization module to the API.
- Schemas - Expose the Schemas module to the API.
- Errors Tracking - Catch errors on app launch / apimap generation / liana session creation.

### Fixed
- Resource Creation - Fix the creation of records having NOT NULL association constraints in the database.

## RELEASE 0.4.3 - 2016-11-17
### Fixed
- Custom Actions - Fix missing actions for Smart Collections.

## RELEASE 0.4.2 - 2016-11-16
### Fixed
- Has Many Getter - Fix the missing data for belongsTo fields while retrieving «has many» associated records.

## RELEASE 0.4.1 - 2016-11-11
### Added
- Field Type - Support Time field type.
- Models - Support resources/charts queries on models having a defaultScope configuration.
- Model - Support model "field" option to specify a database column name.
- Search - Fix global search specific to model sequelize definition.

### Fixed
- Records Index - Fix the duplicate records displayed on the front if the ids are hidden in the list.

## RELEASE 0.3.7 - 2016-11-06
### Changed
- BelongsTo - Better support belongsTo relationships (as, foreign keys, etc.).

### Fixed
- BelongsTo - Fix belongsTo retrieval if the model and association names are different (ex: Capitalized model names).

## RELEASE 0.3.6 - 2016-11-04
### Added
- Schema - Support UUID field type.

### Changed
- Performance - Request only displayed fields in the records list.

### Fixed
- Search - Fix the search on collections with uuid column as a primaryKey.

## RELEASE 0.3.5 - 2016-10-28
### Changed
- Filters - Add the new date filters protocol.

## RELEASE 0.3.4 - 2016-10-14
### Fixed
- Line Charts - Fix the line charts display if no records are found.
- Value Chart - Fix previous period count regression due to filterType introduction.

### Added
- Smart field - Enable search on smart fields.

## RELEASE 0.3.3 - 2016-10-11
### Added
- ES5 - Secure the ES5 compatibility with a git hook.

### Fixed
- BelongsTo - Fix the belongsTo associations on record creation.
- ES5 - Fix ES5 compatibility.

## RELEASE 0.3.2 - 2016-09-30
### Fixed
- HasMany - Fix the hasMany fetch when an integration is set

## RELEASE 0.3.1 - 2016-09-30
### Fixed
- Filter - Support multiple filters on the same field.

## RELEASE 0.3.0 - 2016-09-30
### Added
- Filters - Users want the OR filter operator with their conditions (restricted to simple conditions).

### Fixed
- Record Update - Fix the potential dissociations on record update.

## RELEASE 0.2.39 - 2016-09-29
### Fixed
- Pagination - Fix the hasMany number of records.

## RELEASE 0.2.38 - 2016-09-29
### Fixed
- Close.io - Fix the search regression.

## RELEASE 0.2.37 - 2016-09-28
### Added
- Integration - Add the Close.io integration

## RELEASE 0.2.36 - 2016-09-26
### Added
- Filters - Users want to have "From now" and "Today" operators.

### Fixed
- Search - Fix the search when an association field comes from an integration.
