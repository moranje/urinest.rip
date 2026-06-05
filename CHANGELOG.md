# [3.4.0](https://github.com/moranje/urinest.rip/compare/v3.3.1...v3.4.0) (2026-06-05)


### Bug Fixes

* **a11y:** enforce touch target tokens ([8a54fee](https://github.com/moranje/urinest.rip/commit/8a54feebe20fcf52c217f43e6ff51108303b482d))
* **a11y:** focus questionnaire step titles ([438ef58](https://github.com/moranje/urinest.rip/commit/438ef5806726d2af410e824dd04471b6086e708f))
* **a11y:** preserve primitive touch targets ([a397bcd](https://github.com/moranje/urinest.rip/commit/a397bcd4ce220627fad9d5b5242387d51ba34294))
* **a11y:** satisfy route lighthouse audits ([263c28b](https://github.com/moranje/urinest.rip/commit/263c28b8400dc265d43df2b0eac41277b1325ed2))
* **a11y:** support hyphenated icon button labels ([a4bc5c7](https://github.com/moranje/urinest.rip/commit/a4bc5c7c70e9732aa0146103a3265392b9367064))
* **a11y:** tighten admin login form semantics ([6bd9258](https://github.com/moranje/urinest.rip/commit/6bd9258e0a34d23e345aa2786272beaf1ec67258))
* **a11y:** underline plain text links ([58d6f93](https://github.com/moranje/urinest.rip/commit/58d6f9366b2f15e5cfeff37fdb296ea1dfa4b80d))
* **admin:** surface log mutation failures ([2015cc0](https://github.com/moranje/urinest.rip/commit/2015cc0248ff2d9ceb1dc7271a1ed1da2a56dd26))
* **auth:** expire admin sessions on refresh failure ([63507dd](https://github.com/moranje/urinest.rip/commit/63507dd9bb47ea305b66412b5fc7b1cd328b8249))
* **build:** use public compiler package ([51f57bf](https://github.com/moranje/urinest.rip/commit/51f57bfd2b3ba2e5f08ef33c607b4f6719fc8f80))
* **ci:** avoid private package path literal ([8f2e890](https://github.com/moranje/urinest.rip/commit/8f2e890cc0be54e0c9147a2476005af82fef1485))
* **ci:** use npm registry token ([18aac3a](https://github.com/moranje/urinest.rip/commit/18aac3a1a2cc34ac585c2dcc3192ea6d246f5c55))
* **clinical:** close bacteriurie audit gaps ([6662ea0](https://github.com/moranje/urinest.rip/commit/6662ea06932dc717f9ef72e98c631f159add9bcc))
* **compiler:** build flows before tests ([5f6a243](https://github.com/moranje/urinest.rip/commit/5f6a24364e202190fa9f89da689f182118989115))
* **compiler:** reject duplicate option values ([c28d10b](https://github.com/moranje/urinest.rip/commit/c28d10b2951047b9de12bf9f6c5f373a72fdcef9))
* **compiler:** reject orphan questions ([eba90c9](https://github.com/moranje/urinest.rip/commit/eba90c913b9003c764846d4478286b218956d7be))
* **compiler:** reject unreachable results ([fe1fddc](https://github.com/moranje/urinest.rip/commit/fe1fddce2e8e5b0b220b8047c5f425f5d0ae5968))
* **compiler:** require result source metadata ([7ce4145](https://github.com/moranje/urinest.rip/commit/7ce41457b1b2af8b06e535e8c1f37662dc343232))
* **design:** remove stray checkbox and treatment borders ([0204f95](https://github.com/moranje/urinest.rip/commit/0204f9576e5ccef9848f1bccc79c06da7dc3e15e))
* **design:** soften segmented control active state ([233ad2c](https://github.com/moranje/urinest.rip/commit/233ad2cfddd1f8b1c182321c92ba9ceeca837e54))
* **guidelines:** enforce role responsibility matrix ([afde989](https://github.com/moranje/urinest.rip/commit/afde989a05e6f102a3257039effb0e9096ca457a))
* **header:** simplify logo home link ([ebe093f](https://github.com/moranje/urinest.rip/commit/ebe093fc19c685ac2ef10c001816021a176f3ed3))
* **landing:** constrain questionnaire tiles ([5190210](https://github.com/moranje/urinest.rip/commit/5190210527eba15998a037c82df6938f66da3310))
* **landing:** enforce two-column dashboard grid ([75a760e](https://github.com/moranje/urinest.rip/commit/75a760e6efa805eae6a40927a4bcd6d52af5a2fd))
* **landing:** guard desktop grid invariant ([15cc8f7](https://github.com/moranje/urinest.rip/commit/15cc8f7060645a9f77a82fb5728deca2983f4cd7))
* **landing:** keep dashboard grid two columns ([2b4547f](https://github.com/moranje/urinest.rip/commit/2b4547fc524f96715bc13ee977308a9cdbd24c72))
* **landing:** keep three-column desktop grid ([726ca99](https://github.com/moranje/urinest.rip/commit/726ca996033e8432cac7351bc52b5ee15c708a01))
* **landing:** lock desktop dashboard grid ([08b8b30](https://github.com/moranje/urinest.rip/commit/08b8b303b1b61ee01f0a241cbe29adf5a443f13d))
* **landing:** preserve taxonomy in dev manifest ([5ea4f6e](https://github.com/moranje/urinest.rip/commit/5ea4f6e03c2509d6ff2ca560c709bc1223b812dc))
* **landing:** restore desktop questionnaire grid ([cd5fbde](https://github.com/moranje/urinest.rip/commit/cd5fbdeda2e4641671e60c0eff97ac959fd4dd7e))
* **landing:** restore desktop tile scale ([8cda3a5](https://github.com/moranje/urinest.rip/commit/8cda3a540cccb0a8a1db74069cbeb0f18e033fa5))
* **landing:** use two-column questionnaire grid ([396d75a](https://github.com/moranje/urinest.rip/commit/396d75ac9943a2fada91fee06065dec2757ee086))
* **navigation:** rely on browser back controls ([228a36a](https://github.com/moranje/urinest.rip/commit/228a36a68fc555350951f2eee7f2a6fa2bd71a8d))
* **navigation:** rely on native back history ([8e0a22f](https://github.com/moranje/urinest.rip/commit/8e0a22f0a29fb25c201c68d0c8b2449a5cd6ef05))
* **navigation:** remove remaining ui back affordance ([fb11d5f](https://github.com/moranje/urinest.rip/commit/fb11d5f4d60103ee724a00b66d03141044cb2b5b))
* **navigation:** remove synthetic back wording ([89416fb](https://github.com/moranje/urinest.rip/commit/89416fbb4dfb49731022471ab09e1881766e636c))
* **packages:** allow stable registry smoke ([05ffcd4](https://github.com/moranje/urinest.rip/commit/05ffcd4ba21dee5c61fec6b021ff17908ba8a0f2))
* **packages:** canonicalize gitea metadata ([e2eb5e2](https://github.com/moranje/urinest.rip/commit/e2eb5e28e39772ba1caa3c737244719132327b20))
* **packages:** guard gitea latest publishing ([298133c](https://github.com/moranje/urinest.rip/commit/298133c2de700be6cc747b47052659005b30e15a))
* **packages:** harden gitea publish gates ([f413269](https://github.com/moranje/urinest.rip/commit/f4132690dc6aff90188b1baf910146be3fc795a3))
* **packages:** support gitea publish auth preflight ([99cf204](https://github.com/moranje/urinest.rip/commit/99cf204bd0221b07c760dc8ff4b277d5faca8a9a))
* **packages:** support stable release notes ([d1abc69](https://github.com/moranje/urinest.rip/commit/d1abc69223fe0ca98cebb7607547a35134c5b3d7))
* **packages:** verify clean framework installs ([77130b0](https://github.com/moranje/urinest.rip/commit/77130b0e2d20dc25f9775b515db3174e28e197e0))
* **packages:** verify publish dist tags ([fe32fe7](https://github.com/moranje/urinest.rip/commit/fe32fe775b76078beeff7a1be9a306d28a619132))
* **perf:** handle sync landing prefetch errors ([d8683a1](https://github.com/moranje/urinest.rip/commit/d8683a19e6ef0661b738c4ee3c776e0849aca011))
* **popover:** clear answer info on navigation ([2a8080d](https://github.com/moranje/urinest.rip/commit/2a8080da17b10d9d43e3e0bf15f9f6a2a4067a0b))
* **popover:** keep answer info within viewport ([4b1166d](https://github.com/moranje/urinest.rip/commit/4b1166d890376fa5db9e08aadf80d72fd65fe0b1))
* **popover:** restore answer info focus ([de473e7](https://github.com/moranje/urinest.rip/commit/de473e77a999b948e7e9bfb35d9f7bc44e2391ca))
* **questionnaire:** avoid redirect transition hangs ([6c9656c](https://github.com/moranje/urinest.rip/commit/6c9656c42dba1bb4955b181660499ad8888fbcf5))
* **questionnaire:** avoid transitions during redirects ([13ed65d](https://github.com/moranje/urinest.rip/commit/13ed65d8afbac67bcd22821db02e444dcccbc71b))
* **questionnaire:** repair progress indicator ([c688d02](https://github.com/moranje/urinest.rip/commit/c688d02eafd9cd8fe76b01e4d55082ea29e8639a))
* **router:** harden questionnaire back routes ([286435e](https://github.com/moranje/urinest.rip/commit/286435eb42c50c3f0575a8f3f4cfa4453952b3f0))
* **router:** persist questionnaire history state ([748ba5d](https://github.com/moranje/urinest.rip/commit/748ba5d4ca8e5a235f4ecbf8dda19d76fb8b02fc))
* **router:** preserve source flow on redirects ([14d9d1f](https://github.com/moranje/urinest.rip/commit/14d9d1fdc390405d97395740b76ca38719494b0f))
* **router:** skip transitions for clinical routes ([d4ee34d](https://github.com/moranje/urinest.rip/commit/d4ee34d38e8996edf8f913c4f4e3cc1027ec4104))
* **security:** allowlist framework telemetry context ([e167ab9](https://github.com/moranje/urinest.rip/commit/e167ab92d96d9c2c13949dfe4e72c47d1c183286))
* **security:** enforce strict browser headers ([187c3ed](https://github.com/moranje/urinest.rip/commit/187c3edc378018adfea08d96a190668ae2b48ae1))
* **security:** fail on project npmrc auth ([cb6ba64](https://github.com/moranje/urinest.rip/commit/cb6ba64a5850a6ead560dc837b03f0551ff3f2bb))
* **security:** harden framework boundary gate ([abb3d80](https://github.com/moranje/urinest.rip/commit/abb3d8005a7c973fd9a0ba927993d56d4bbc572f))
* **security:** harden Supabase log access ([776a7a0](https://github.com/moranje/urinest.rip/commit/776a7a0dfca155ac8a25b0c0b8264bf6f975f8b6))
* **store:** preserve manifest during reload failures ([b7deee6](https://github.com/moranje/urinest.rip/commit/b7deee6397ba8a0e25bb3fc74665f3617ce9a965))
* **telemetry:** disable local preview persistence by default ([f0851d3](https://github.com/moranje/urinest.rip/commit/f0851d34059753fb1d28016e07b4fec7abbcfc37))
* **telemetry:** harden clinical context scrubbing ([dfe43f8](https://github.com/moranje/urinest.rip/commit/dfe43f8cbf00c5b31e9ec93cf7589ddaf01d13cc))
* **telemetry:** harden log sink persistence ([577c353](https://github.com/moranje/urinest.rip/commit/577c3533753a55da5d7b74f25d0d79cd092538c0))
* **telemetry:** hash clinical identifiers ([70ff50a](https://github.com/moranje/urinest.rip/commit/70ff50ad9226c7fd4d198adeec59b9102c75b156))
* **telemetry:** keep flow version logging ([92aeb10](https://github.com/moranje/urinest.rip/commit/92aeb107e60dcf7298f8652143cb67da2542459d))
* **telemetry:** make source consumer configurable ([4eda581](https://github.com/moranje/urinest.rip/commit/4eda58189ab75cb9eb451872f5e9feb0e91bed14))
* **telemetry:** suppress dev transition noise ([24e9d05](https://github.com/moranje/urinest.rip/commit/24e9d05bc64ffdc54cab49b0c404ac49614278a4))
* **theme:** align storybook with system theme ([6d7e379](https://github.com/moranje/urinest.rip/commit/6d7e379eb3e71421dd13aaf59eea2ff64b6292fe))
* **theme:** centralize design tokens ([e3eea97](https://github.com/moranje/urinest.rip/commit/e3eea970c2865cb23258e16870533815515427be))
* **theme:** sync browser theme color ([c13dc38](https://github.com/moranje/urinest.rip/commit/c13dc388c72e1a6c8884038ae710b4fab7d09f8f))
* **types:** declare vue modules for tsgo ([4c7aea1](https://github.com/moranje/urinest.rip/commit/4c7aea1b92507852823b2b8ce9019de9b91cf359))
* **types:** exclude package build outputs ([9cbe3c4](https://github.com/moranje/urinest.rip/commit/9cbe3c4177495a0aa4c0848a1799d4adcd6ca799))
* **ui:** flatten segmented control indicator ([8fb3761](https://github.com/moranje/urinest.rip/commit/8fb37616036ba4b342fc068ea8f143c7c63f7c22))
* **ui:** harden questionnaire history regressions ([f4dd216](https://github.com/moranje/urinest.rip/commit/f4dd2167340bc13e021177ae2d3dff72634b8b93))
* **ui:** let notice primitive own spacing ([f3c8ef3](https://github.com/moranje/urinest.rip/commit/f3c8ef36e93e82e8268b961d4ab741dafbe85625))
* **ui:** polish questionnaire affordances ([c0a92e1](https://github.com/moranje/urinest.rip/commit/c0a92e14ec2c58388777704dc681a95ca3a439f9))
* **ui:** remove checkbox and notice outline clutter ([854f393](https://github.com/moranje/urinest.rip/commit/854f393c4ebaf2e91ceb65a2ab91f5e598887903))
* **ui:** remove noisy answer borders ([24988eb](https://github.com/moranje/urinest.rip/commit/24988eb5bba2cd1f3c29a9022dd30c6ddea7b547))
* **ui:** remove question copy separator ([3837e6a](https://github.com/moranje/urinest.rip/commit/3837e6afa59dbc204f864db2e8952343c092d722))
* **ui:** remove residual surface borders ([1a78c7e](https://github.com/moranje/urinest.rip/commit/1a78c7ebd6657df29df655e8e90cc1bdb8a59116))
* **ui:** remove segmented control glow ([eed93c8](https://github.com/moranje/urinest.rip/commit/eed93c8c79cb46e37e0b66ea96f2570dd27633e5))
* **ui:** remove segmented control glow ([6840feb](https://github.com/moranje/urinest.rip/commit/6840feb98be72b945605ca8a3f88cb27d3235ece))
* **ui:** stabilize answer info popovers ([636bb1d](https://github.com/moranje/urinest.rip/commit/636bb1d75b445bc2a6d25eb08f61bfbc31cdfdb2))
* **ux:** show pending feedback on submit ([4dde6b7](https://github.com/moranje/urinest.rip/commit/4dde6b75e8e992cf7c48d4eee43884e1cac94608))
* **vue:** contain answer persistence failures ([794a2f0](https://github.com/moranje/urinest.rip/commit/794a2f0a1d446a30b6eecb5484b4afd1f82c0d4e))
* **vue:** export runner option answer type ([3391b42](https://github.com/moranje/urinest.rip/commit/3391b42dea3d4f6753415f9270d194aaff7746ec))
* **vue:** filter restored answer state ([443d43b](https://github.com/moranje/urinest.rip/commit/443d43bf8b478cdf3ebe059b64cc45d1b3ebd231))


### Features

* **audit:** close ux telemetry and budget gaps ([64014b7](https://github.com/moranje/urinest.rip/commit/64014b74cb56482bdd1e913647af3e9fd9128823))
* **compiler:** add flow taxonomy metadata ([b4f98d5](https://github.com/moranje/urinest.rip/commit/b4f98d587084ee91ff7a7f4b202c6a6d75657f18))
* **compiler:** add standalone build cli ([f513a73](https://github.com/moranje/urinest.rip/commit/f513a738690d6fea6782905e15042a93342939aa))
* **compiler:** enforce authoring defense gate ([49d4621](https://github.com/moranje/urinest.rip/commit/49d462121cc552f5a2b23007a9880b516fb18faa))
* **compiler:** export flow json schema ([576470b](https://github.com/moranje/urinest.rip/commit/576470b1315259bc12ca8b7c0217cc80c1ff9136))
* **compiler:** export vite build plugin ([7da76d8](https://github.com/moranje/urinest.rip/commit/7da76d86ad5dc740eb69a93e8930476ce3ad49df))
* **core:** add calculator extension contract ([ca3b397](https://github.com/moranje/urinest.rip/commit/ca3b397718ca3da9305d93966e2c282bee403e31))
* **core:** add condition validation wrapper ([8007e12](https://github.com/moranje/urinest.rip/commit/8007e120b74c7927974d1d76886ddb84348fd511))
* **core:** add deterministic audit trail model ([1101150](https://github.com/moranje/urinest.rip/commit/1101150936d7dc3dacd1914d5902777516246820))
* **core:** add manifest type contract ([836a0b7](https://github.com/moranje/urinest.rip/commit/836a0b712e26f38deeb178ea84a273caf0323ff2))
* **core:** add questionnaire graph traversal ([917578d](https://github.com/moranje/urinest.rip/commit/917578d3a39c1403a70602ae376e8f6d305fcbd1))
* **core:** add runtime context injection ([d60d387](https://github.com/moranje/urinest.rip/commit/d60d387f027a6c8f505c5d825bddb5325d36dcaf))
* **core:** add typed outcome package ([7bd4161](https://github.com/moranje/urinest.rip/commit/7bd4161e4c348c873d81c1f5dabca493d133edba))
* **core:** add verified calculator contract ([f383301](https://github.com/moranje/urinest.rip/commit/f3833014a8b0506b282b9c800f55895cbd057dde))
* **core:** normalize decision manifests ([69dc951](https://github.com/moranje/urinest.rip/commit/69dc9517fbb17f543e44b5e4918977ba093a5b3d))
* **core:** own outcome resolution ([982bde9](https://github.com/moranje/urinest.rip/commit/982bde9709881e6d2cad87880988d1b134d49f87))
* **cvrm:** add u-prevent calculator package ([c821acb](https://github.com/moranje/urinest.rip/commit/c821acbca824a0e941656e374c5b57bd3042f6a6))
* **cvrm:** add verified aha prevent calculator ([4b1c754](https://github.com/moranje/urinest.rip/commit/4b1c754aa2be280b8d6dc29f58bf46762d515982))
* **design:** centralize motion utilities ([5314b7e](https://github.com/moranje/urinest.rip/commit/5314b7e226c574247061b855ace086a5371b7213))
* **design:** harden motion theming and a11y ([1aff15d](https://github.com/moranje/urinest.rip/commit/1aff15dd9fc9b44afcd4c3e52380b855641389e9))
* **errors:** configure user-facing copy ([bb57763](https://github.com/moranje/urinest.rip/commit/bb5776398d94eeec68dd0d721051765a8ed79312))
* **framework:** add score-driven calculator bindings ([0142228](https://github.com/moranje/urinest.rip/commit/01422283b8f1488317f7a83daceb58ab89af5ec1))
* **molecules:** add choice group ([d9b1207](https://github.com/moranje/urinest.rip/commit/d9b12079326a13fe53bd0acbad2374ce2f4aefae))
* **molecules:** add choice option ([11bee58](https://github.com/moranje/urinest.rip/commit/11bee588af4a8dcfdf001ad14ba4ec2bef2e374d))
* **molecules:** add copy action ([65512b9](https://github.com/moranje/urinest.rip/commit/65512b912e19af74bceb0dd2c7d9e83001857c16))
* **molecules:** add form field ([c1caa7c](https://github.com/moranje/urinest.rip/commit/c1caa7ce45007e16ffc41ecbc3b453cbe2bf9808))
* **molecules:** add info popover ([4c2c9df](https://github.com/moranje/urinest.rip/commit/4c2c9dfb316cee1b81dde5b4d0904de72e23b2cd))
* **molecules:** add notice ([82d6d6a](https://github.com/moranje/urinest.rip/commit/82d6d6a6da0f2a16332bd746bcfd02914e9e6ba8))
* **molecules:** add segmented control ([ed7ed69](https://github.com/moranje/urinest.rip/commit/ed7ed69d0be03c5f6fd43c80323f187c301e47c2))
* **molecules:** add source chip ([ba8132c](https://github.com/moranje/urinest.rip/commit/ba8132c1115a7a5f781bd0dbf1cefb765c10e55f))
* **molecules:** add status badge ([0e6b5e4](https://github.com/moranje/urinest.rip/commit/0e6b5e4aad35513294bb708779bc6367b468a376))
* **organisms:** add admin log detail ([1118273](https://github.com/moranje/urinest.rip/commit/1118273e9843b90c1bbd143ff65c21f7b7aff7ab))
* **organisms:** add admin log list ([d86eec6](https://github.com/moranje/urinest.rip/commit/d86eec6530cff4fbb961aaf3aae58ab00bdb46e3))
* **organisms:** add contraindication gate ([57dfd36](https://github.com/moranje/urinest.rip/commit/57dfd3656b7fc35846e97fe1828559479d4b91ec))
* **organisms:** add documentation copy panel ([8681ca8](https://github.com/moranje/urinest.rip/commit/8681ca8dfc9bb9ad36d82d45536b766bb458a2f0))
* **organisms:** add question panel ([4ddc5c6](https://github.com/moranje/urinest.rip/commit/4ddc5c69bee25e6b062b6b3a7b37a048d59597fe))
* **organisms:** add question toolbar ([e3009d2](https://github.com/moranje/urinest.rip/commit/e3009d2370464b202e0fd3242a4fb9beef021e29))
* **organisms:** add result section list ([0fc276f](https://github.com/moranje/urinest.rip/commit/0fc276f4393e16341624a44f18e1d94102fae15b))
* **organisms:** move app header ([62edf93](https://github.com/moranje/urinest.rip/commit/62edf9322e812997040483228fc0e8f225db346a))
* **packages:** add copd care calculator package ([96607af](https://github.com/moranje/urinest.rip/commit/96607afa35d97728048d2cfc4dd1a30f1252ccd3))
* **packages:** add dm care calculator package ([82e89b1](https://github.com/moranje/urinest.rip/commit/82e89b13e622b89348b28c9bde0e8948f1b72212))
* **packages:** add standalone framework extraction gate ([c0a7136](https://github.com/moranje/urinest.rip/commit/c0a7136ba3470fd654ecd999eca319bd77b0f992))
* **packages:** consume gitea registry prerelease ([43b98b3](https://github.com/moranje/urinest.rip/commit/43b98b3db8ff8c97b01a40943ce0f5f4708d53a9))
* **packages:** consume stable beslismodel release ([dea6fa5](https://github.com/moranje/urinest.rip/commit/dea6fa5e861a2b0ab41978387075de27d1bad254))
* **packages:** guard stable publish tag ([aff99f1](https://github.com/moranje/urinest.rip/commit/aff99f1c29d0313b7b4bc605a9f9ce0eaa3c9e92))
* **perf:** prefetch landing questionnaires ([c35401d](https://github.com/moranje/urinest.rip/commit/c35401d4bc1f7665071523e47c5db96c10f93a9f))
* **primitives:** add form controls ([32de085](https://github.com/moranje/urinest.rip/commit/32de085dbe9bd84dd4efc65a47b5fa675cf03e01))
* **questionnaire:** add grouped multi-input steps ([8e4e922](https://github.com/moranje/urinest.rip/commit/8e4e922e7bf90399f2fdd540d25f094bd49db6b2))
* **questionnaire:** add scrubbed flow telemetry ([f75b1b7](https://github.com/moranje/urinest.rip/commit/f75b1b7f0801599c1f8b96dadfe49f670c0fc0a3))
* **store:** add manifest cache strategy ([0fb3d53](https://github.com/moranje/urinest.rip/commit/0fb3d53c5be51f3abcdc05711bbaa18c60970e02))
* **telemetry:** add supabase framework adapter ([1871664](https://github.com/moranje/urinest.rip/commit/187166430a70403c5f6396c665f689028bd193d7))
* **telemetry:** add typed breadcrumb model ([ec7cd9b](https://github.com/moranje/urinest.rip/commit/ec7cd9b68e6df410dc047f7ce6836528d2053dce))
* **telemetry:** record privacy-safe web vitals ([c524a9f](https://github.com/moranje/urinest.rip/commit/c524a9f4d2fad093ad2a0c531862669f705f944b))
* **telemetry:** share error classification ([3e13bdc](https://github.com/moranje/urinest.rip/commit/3e13bdc3e563b7d4c28150589538314faee9f4be))
* **templates:** add admin template ([d3ec552](https://github.com/moranje/urinest.rip/commit/d3ec55205c8083b37cb2f6eeef6d295156b419df))
* **templates:** add landing template ([e59ca60](https://github.com/moranje/urinest.rip/commit/e59ca602c2643702e2fbbefe7e73c1492e0697df))
* **templates:** add page shell ([eb1e9be](https://github.com/moranje/urinest.rip/commit/eb1e9be09e17e4bf1b03fdc10e0debf01301b024))
* **templates:** add questionnaire template ([4a485f1](https://github.com/moranje/urinest.rip/commit/4a485f156b6fd92bad12524110effc4c2cfa3ccb))
* **templates:** add result template ([aec54e1](https://github.com/moranje/urinest.rip/commit/aec54e1ca4e6647e963c7f2be8521f3e3f13a9b6))
* **testing:** add guideline traceability assertions ([a5cfad5](https://github.com/moranje/urinest.rip/commit/a5cfad5e6fecdd5a050f4d840cb2ce1ec62000fb))
* **testing:** add safety fixture helpers ([4a3f27e](https://github.com/moranje/urinest.rip/commit/4a3f27ebb5f19c722cd4e30604551fd04cbdee26))
* **theme:** generate design token metadata ([fa01de1](https://github.com/moranje/urinest.rip/commit/fa01de1e381d691733128f4d66250ae1af041fda))
* **ui:** add safe text link primitive ([549eeb7](https://github.com/moranje/urinest.rip/commit/549eeb766bade3cf3485c53e44f24694904de77b))
* **ui:** add toast molecule ([7c1ecf0](https://github.com/moranje/urinest.rip/commit/7c1ecf09f9b1242ef845fb2eb2c21344d21acf35))
* **vue:** add data ready route guard ([0337905](https://github.com/moranje/urinest.rip/commit/033790573cae088c0dcd7f0d42d093b78d07b119))
* **vue:** add landing menu grid ([b299e52](https://github.com/moranje/urinest.rip/commit/b299e52e5920a4c82758de4c295891d178e4f539))
* **vue:** add questionnaire runner composable ([fd5e994](https://github.com/moranje/urinest.rip/commit/fd5e9943a3052f02a0ab4b78e833e398ed717ff9))
* **vue:** add result resolver composable ([e57c6db](https://github.com/moranje/urinest.rip/commit/e57c6db4bb487fd847d6c7ffe124dfc596968153))
* **vue:** add runner answer handlers ([55f1547](https://github.com/moranje/urinest.rip/commit/55f1547a836eeab78348611ec65c146dc8a307aa))
* **vue:** add runner renderer components ([daca7d1](https://github.com/moranje/urinest.rip/commit/daca7d12cede5356312118efede420ecef72957d))
* **vue:** add store factory package ([95b7a49](https://github.com/moranje/urinest.rip/commit/95b7a496e456b567422888f883d69822bfe2eb5b))


### Performance Improvements

* **landing:** lazy-load questionnaire artwork ([1d0cf6e](https://github.com/moranje/urinest.rip/commit/1d0cf6ed0b3da4ceb29c9e8a9ade1a305bdde5dd))
## [3.3.1](https://github.com/moranje/urinest.rip/compare/v3.3.0...v3.3.1) (2026-05-21)
# [3.3.0](https://github.com/moranje/urinest.rip/compare/v3.2.0...v3.3.0) (2026-05-20)


### Bug Fixes

* **admin:** extract eventDetail helper voor oxfmt-compat in LogDetail ([16bdda0](https://github.com/moranje/urinest.rip/commit/16bdda011fb2b2cf3cb9f967557ba8706a813bac))
* **landing:** square mobile tiles without row overlap, responsive SVGs ([5a33a2e](https://github.com/moranje/urinest.rip/commit/5a33a2ebfc6a9ef584201b342c3dee33d9dc5bf8))
* **log-sink:** classify permanent errors, beacon on unload, drop double-write ([d9e6dbe](https://github.com/moranje/urinest.rip/commit/d9e6dbe449956078054ed2bbe564458c9aa3997c))
* **transitions:** remove Vue out-in transition conflict with View Transitions API ([4ad3cba](https://github.com/moranje/urinest.rip/commit/4ad3cba4cd5844a4a7c0cce805f2a835db760b13))


### Features

* **a11y:** a11y- en view-transition-hardening in app shell en views ([bbe8a6f](https://github.com/moranje/urinest.rip/commit/bbe8a6f315238dbf35390746fe7130cc0c7251c2))
* **a11y:** a11y-hardening in admin-componenten ([44e8f85](https://github.com/moranje/urinest.rip/commit/44e8f85e8a3d3fcdd7ad84747807a8ecdc7fe285))
* **a11y:** a11y-hardening in root-componenten ([951ec60](https://github.com/moranje/urinest.rip/commit/951ec60c21e1b3b3251536e117cd41be424f7d96))
* **feedback:** offline-banner-component voor offline-status melding ([b68d9cf](https://github.com/moranje/urinest.rip/commit/b68d9cf0908a448e2ab99f1d8fcdbf26378c461e))
* **primitives:** herbruikbare UI-primitives met a11y-tests ([c5256a8](https://github.com/moranje/urinest.rip/commit/c5256a8a42ce7204f97649a18e0568bd2fd6444f))
* **storybook:** design tokens showcase voor kleuren typografie shape spacing ([4e535d0](https://github.com/moranje/urinest.rip/commit/4e535d02e783d4bce2f6720901e26a3abf6bfd64))
* **storybook:** stories voor zes primitives met variants ([61bef13](https://github.com/moranje/urinest.rip/commit/61bef13b69735e0eec43d0bfe9e1ee9e778da018))
* **styles:** design tokens, breakpoint system en motion-utility uitbreiding ([747e7c6](https://github.com/moranje/urinest.rip/commit/747e7c66b3fd1ccf32da498e3b9af4a12ce9963d))
# [3.2.0](https://github.com/moranje/urinest.rip/compare/v3.1.3...v3.2.0) (2026-02-26)


### Features

* redesign SVG illustrations with simplified viewboxes and animations ([02e6a56](https://github.com/moranje/urinest.rip/commit/02e6a56b30884c263c3b13b74cffe7e856a84e42))



## [3.1.3](https://github.com/moranje/urinest.rip/compare/v3.1.2...v3.1.3) (2026-02-24)



## [3.1.2](https://github.com/moranje/urinest.rip/compare/v3.1.1...v3.1.2) (2026-02-24)



## [3.1.1](https://github.com/moranje/urinest.rip/compare/v3.1.0...v3.1.1) (2026-02-22)


### Bug Fixes

* format build date as dd-mm-yyyy ([695abb7](https://github.com/moranje/urinest.rip/commit/695abb7fa92b474b8298b2cdd5ea553bcd210c72))



# [3.1.0](https://github.com/moranje/urinest.rip/compare/v3.0.2...v3.1.0) (2026-02-22)


### Features

* add build date, guideline review dates and project docs ([268f1d1](https://github.com/moranje/urinest.rip/commit/268f1d101c1d81d75e06c82c55dbf3788a0b8364))



## [3.0.2](https://github.com/moranje/urinest.rip/compare/v3.0.1...v3.0.2) (2026-02-22)


### Bug Fixes

* keep header visible on mobile and show admin icon always ([ddeb391](https://github.com/moranje/urinest.rip/commit/ddeb39169b75a89ed3cd70b76c6d2eddcec5f957))



## [3.0.1](https://github.com/moranje/urinest.rip/compare/v3.0.0...v3.0.1) (2026-02-22)


### Bug Fixes

* **ci:** disable Netlify auto-build and add workflow_dispatch ([9bfd1a5](https://github.com/moranje/urinest.rip/commit/9bfd1a5c227b927bcf7ca385e69348d79ec9e04c))



# 3.0.0 (2026-02-22)


* feat!: migrate to Vite + Vue 3 with decision engine ([4bd85d6](https://github.com/moranje/urinest.rip/commit/4bd85d6d25b02eaad4392284c6bdc0ae97ade440))
* chore!: remove legacy Nuxt framework and assets ([fbad9f6](https://github.com/moranje/urinest.rip/commit/fbad9f67a2d99e83f067553344f6e613e9255568))


### Bug Fixes

* :card_file_box: Update documentation ([89402a2](https://github.com/moranje/urinest.rip/commit/89402a27a256aded93d036b7453a15d9cf865944))
* :lipstick: fix logo padding ([37c270f](https://github.com/moranje/urinest.rip/commit/37c270f6241c0dc33564efa90c29da4faf28aa19))
* :lipstick: logo padding relative to from text ([2b5b6cf](https://github.com/moranje/urinest.rip/commit/2b5b6cf1c5dfade9e41aa5aa379f8478764341c2))
* actionable plan when prescribing cipro in patients with renal insufficiency ([f0cecce](https://github.com/moranje/urinest.rip/commit/f0cecce3a44fad3f876005a4fb0954c4c76dc115))
* add db reference ([14b0af5](https://github.com/moranje/urinest.rip/commit/14b0af546cd7bccf4994c4031823a9e0ed334b83))
* add missing data ([3f3c3dd](https://github.com/moranje/urinest.rip/commit/3f3c3ddc6ab5029202ee887e7fd479145c3e3f3b))
* add missing icons ([f79fbfd](https://github.com/moranje/urinest.rip/commit/f79fbfd874ad4bf426b56d774610209f07ab94f1))
* all indications for culture included ([d208724](https://github.com/moranje/urinest.rip/commit/d208724fb79447a91dbad778f31035b7f7a74b67))
* antibiotic advice not showing up ([b9c69df](https://github.com/moranje/urinest.rip/commit/b9c69dfab04e8fd43f5ce541b4f3842acc3e984b))
* broken dipslide form ([8c7232f](https://github.com/moranje/urinest.rip/commit/8c7232f924aadcba8961e52bd1a4f3715f759b9e))
* **ci:** disable husky hooks in deploy job ([ca183a4](https://github.com/moranje/urinest.rip/commit/ca183a4fc1394749692fea418496590d118e2b7a))
* **ci:** install conventional-changelog angular preset explicitly ([640d423](https://github.com/moranje/urinest.rip/commit/640d423edb53b0d0ac49db3c69ea7316985927a1))
* clarify culture testing conditions ([9a90ee8](https://github.com/moranje/urinest.rip/commit/9a90ee8cbb94b821a3828c060d2c8e728b078306))
* clearer wording ([3ff69cb](https://github.com/moranje/urinest.rip/commit/3ff69cb6065378e92e2a052511f617b461ccf9b8))
* dipslide form routing ([91d9f60](https://github.com/moranje/urinest.rip/commit/91d9f600a05ad276ac0d7030bb10b28f36f6c496))
* first question item not aligning ([95a5707](https://github.com/moranje/urinest.rip/commit/95a570737c95031113509b8bad715366d3978cd2))
* fix documentation references in blood route ([a4341ff](https://github.com/moranje/urinest.rip/commit/a4341ffc1d029d475740a689cf1913995a62a82f))
* fix logo padding ([0990a66](https://github.com/moranje/urinest.rip/commit/0990a6683d5f6a76c7c2216a26ddd71cebc13fef))
* fix uti elderly risk group not showing advice ([21ac1f8](https://github.com/moranje/urinest.rip/commit/21ac1f81fafb983c0a0cd2aa7f182a9dfdb75471))
* force update cache ([7e39d63](https://github.com/moranje/urinest.rip/commit/7e39d63867074f3db29c73db0ffe6d53a4e5f5a9))
* internalize vue flow form ([e32e6e4](https://github.com/moranje/urinest.rip/commit/e32e6e4e32baeaa2f2118626dd9019606c8b00bc))
* localize user image ([5ab6439](https://github.com/moranje/urinest.rip/commit/5ab6439ec27cb44b6a416e555bad7c566c886c95))
* logo navigates to home ([d6f3bf3](https://github.com/moranje/urinest.rip/commit/d6f3bf33e6b437c8987872d07e6dca64f85ea162))
* missing step in elderly leukocyte algorithm ([2d26278](https://github.com/moranje/urinest.rip/commit/2d262780c2f99ca72d0db886fcb7965a52977a0b))
* name on abouy ppage not aligning ([e9d3ced](https://github.com/moranje/urinest.rip/commit/e9d3ceda3e25d2bd470b88214b2528f61150e0be))
* prevent flickering between forms ([2796c87](https://github.com/moranje/urinest.rip/commit/2796c87935c258b2409f8443aebcb7418048aa0e))
* prevent hydration error on advice page ([00fcc3e](https://github.com/moranje/urinest.rip/commit/00fcc3e3b1f490e075743758a5126279aaa4af43))
* sources not showing up ([9e49ee4](https://github.com/moranje/urinest.rip/commit/9e49ee4e5baaf4e1867b3c4cfb7fe31e3a19b112))
* twisted logic in leukocyturia ([acc3006](https://github.com/moranje/urinest.rip/commit/acc30061a66d9641810003b787ca6b790136742e))
* update data ([240d944](https://github.com/moranje/urinest.rip/commit/240d9440857ea1836be117ca9645dd3187b307fd))
* update documentation and advice ([98f66c5](https://github.com/moranje/urinest.rip/commit/98f66c54cfdcc3f6853513522be1e0a8b83bc36f))
* update page title ([c98ea33](https://github.com/moranje/urinest.rip/commit/c98ea33b38c2d44f80e7f39a12dad61e07e9bd82))
* update urine data ([db5dcc8](https://github.com/moranje/urinest.rip/commit/db5dcc87c2500003b391ccf6deea75325258c825))


### Features

* add about page ([69ce596](https://github.com/moranje/urinest.rip/commit/69ce5964b732c398f92ac251da825f943c26a84b))
* add blood in urine diagnostic tract ([e83a22a](https://github.com/moranje/urinest.rip/commit/e83a22aa5ac94cddf24f6661af1c7f1844552c65))
* add contra-indications ([b22cf99](https://github.com/moranje/urinest.rip/commit/b22cf99c67dd4e76a6cfaeb429a3f0228bef1ccc))
* add contra-indications ([1b8ea5c](https://github.com/moranje/urinest.rip/commit/1b8ea5c3fef40aa57a6ace22ca7baa1535f376f5))
* add favicon ([135d106](https://github.com/moranje/urinest.rip/commit/135d1062b96fcd5822d5dfda0073ef0f8d2df0a3))
* add leukocyte diagnostic tract ([88fede7](https://github.com/moranje/urinest.rip/commit/88fede7e19276c534b0a998af0239ed0aa9e9839))
* add medical decision flow definitions ([072c79e](https://github.com/moranje/urinest.rip/commit/072c79eae5c2fda1231b7cc3ebf439955e87c017))
* add Supabase database migrations and analytics ([5aefe8c](https://github.com/moranje/urinest.rip/commit/5aefe8c105f4a92c39af8e34b310ade9eba09c60))
* add web manifest ([85ddd85](https://github.com/moranje/urinest.rip/commit/85ddd85d557ea4cc8ae55732c9d780ed1dc0fb5f))
* better wording in healthy woman form ([e01a3c5](https://github.com/moranje/urinest.rip/commit/e01a3c5240d04b78bc0f353934ddebeb2431270f))
* enable storing and editing of treatment text ([5b6b10f](https://github.com/moranje/urinest.rip/commit/5b6b10f69180febf76ece8f96907b2fe6be9308b))
* full offline capabilities ([3a0672b](https://github.com/moranje/urinest.rip/commit/3a0672babccdaee5c45f30d44171a394c7b3abfa))
* make app installable ([1a78e11](https://github.com/moranje/urinest.rip/commit/1a78e11b2286f7d1628f61a9e789164bb377c0f1))
* name typo ([30d095b](https://github.com/moranje/urinest.rip/commit/30d095bbd276ffea24ea1488b7d13593fc50c6a2))
* new landing page ([190a485](https://github.com/moranje/urinest.rip/commit/190a485590af731a649aa2c4d47bc4c2f9d39bee))
* sticky header ([195a503](https://github.com/moranje/urinest.rip/commit/195a5035b9e352cd86c67ce4feff574af2306c7d))
* update info screen for better ledgebility ([f93928b](https://github.com/moranje/urinest.rip/commit/f93928bf39827b288dc777ee3e3503488525c3ee))
* update logic for vulnerable eldery ([e638f92](https://github.com/moranje/urinest.rip/commit/e638f920b0f467348c99bd9586cf94ff6100d667))
* update web app to nuxt ([5f206cc](https://github.com/moranje/urinest.rip/commit/5f206ccee0f7599eeeb1a50736a854b3c33a4203))


### BREAKING CHANGES

* Complete framework migration from Nuxt to Vite + Vue 3.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
* Complete removal of Nuxt framework.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>



