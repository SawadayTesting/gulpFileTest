// gulpプラグインの読み込み
const gulp = require('gulp'),
	// ファイルを結合する
	rename = require('gulp-rename'),
	// ejsの空白を正規表現で置換する
	replace = require('gulp-replace');

// ejsをコンパイルするプラグインの読み込み
const ejs = require('gulp-ejs');

// Sassをコンパイルするプラグインの読み込み
const sass = require('gulp-sass'),
	// _partialの一括インポート機能の読み込み
	sassGlob = require('gulp-sass-glob'),
	// エラー発生時にGulpのtask実行を継続
	plumber = require('gulp-plumber'),
	// エラー発生時にダイアログを出す
	notify = require('gulp-notify'),
	// postcssに依存する機能の前提
	postcss = require('gulp-postcss'),
	// ベンダープレフィクスの自動付与
	autoprefixer = require('autoprefixer'),
	// Grid layoutプロパティにベンダープレフィクスを付与
	autoprefixerOption = {
		grid: true
	},
	// 各ブラウザのflexboxの微細なバグを修正
	flexBugsFix = require('postcss-flexbugs-fixes'),
	// メディアクエリをまとめる
	mqpacker = require('css-mqpacker'),
	// プロパティの自動整列
	cssDeclarationSorter = require('css-declaration-sorter'),
	// CSS内の未使用の指定を削除
	purgecss = require('gulp-purgecss'),
	// CSSの整形
	gulpStylelint = require('gulp-stylelint');

// ローカルサーバー起動、自動更新用タスク
const browserSync = require('browser-sync').create(),
	browserSyncOption = {
		server: './product' //コンパイルされたファイルが置かれたディレクトリを指定
	}

//---------------------------------------------------------


// ----------------------------------------
//		pugの監視+コンパイルするタスクを作成
// ----------------------------------------
//テスト機能。ejsと排他。
const pug = require('gulp-pug');
gulp.task("pugWatch", () => {
	return gulp.watch(["./src/pug/**/*.pug"], () => {
		return gulp.src("./src/pug/**/*.pug")
			.pipe(plumber({
				errorHandler: notify.onError("Error: <%= error.message %>")
			}))
			.pipe(pug({
				pretty: true
			}))
			.pipe(gulp.dest("./product"))
	});
});
// ----------------------------------------
//		ejsの監視+コンパイルするタスクを作成
// ----------------------------------------
gulp.task("ejsWatch", () => {
	// src/ejs以下の全てのejsファイルを監視
	return gulp.watch(["src/ejs/**/*.ejs"], () => {
		// .src/ejs以下の全てのejsの更新があった場合の処理
		return (
			gulp
			// 全てのejsファイルを取得,文頭に"_"があるものは除く
			.src("src/ejs/*.ejs")
			// ejsのコンパイルを実行
			.pipe(ejs())
			.pipe(rename({
				extname: '.html'
			}))
			//DOCTYPE以前の変数部分の空行を削除
			.pipe(replace(/[\s\S]*?(<!DOCTYPE)/, "$1"))
			// productフォルダーに*.htmlを保存
			.pipe(gulp.dest("product"))
		);
	});
});

//---------------------------------------------------------------

// ----------------------------------------
//		scssの監視+style.scssをコンパイルする
// ----------------------------------------
gulp.task("scssWatch", () => {
	// src/sass以下の全てのscssファイルを監視
	return gulp.watch(["./src/sass/**/*.scss"], function () {
		// .src/sass以下の全てのscssの更新があった場合の処理
		return (
			gulp
			// style.scssファイルを取得
			.src("src/sass/style.scss")
			// Sassのコンパイルを実行
			.pipe(plumber({
				errorHandler: notify.onError(
					"Error: <%= error.message %>")
			}))
			// plumberの引数にエラーを設定,gulp.srcの直下に指定
			.pipe(sassGlob()) //「sass」の前に設定。
			.pipe(sass({
					outputStyle: "expanded"
				})
				// Sassのコンパイルエラーを表示
				// (これがないと自動的に止まってしまう)
				.on("error", sass.logError))
			// postcssは、sassの後に指定
			// ベンダープレフィクスの自動付与
			.pipe(postcss([autoprefixer(autoprefixerOption)]))
			// 各ブラウザのflexboxの微細なバグを修正
			.pipe(postcss([flexBugsFix()]))
			// メディアクエリをまとめる
			.pipe(postcss([mqpacker()]))
			// プロパティの自動整列を実行
			.pipe(postcss([cssDeclarationSorter({
				order: 'alphabetical'
			})]))
			// コンパイルするcssのファイル名をstyle-noreset.cssに指定
			.pipe(rename({
				extname: '.css' //今後minify化するなら.min.cssなど
			}))
			// css内の未使用の指定をhtmlのクラス、要素名と対応させて検索＋削除。
			.pipe(
				purgecss({
					content: ['product/**/*.html']
				})
			)
			// cssの整形
			.pipe(
				gulpStylelint({
					fix: true
				})
			)
			// ./src/noreset-cssにcssを保存
			.pipe(gulp.dest("product/css"))
		);
	});
});

// ----------------------------------------
//		ブラウザの監視+更新のタスク
// ----------------------------------------

// ローカルサーバーを立てる
gulp.task('serve', (done) => {
	browserSync.init(browserSyncOption)
	done()
})

gulp.task('browserWatch', (done) => {
	const browserReload = (done) => {
		browserSync.reload()
		done()
	}
	//src以下のファイルに変更があった場合、ブラウザを更新する
	gulp.watch('./src/**/*', browserReload)
	//product以下のファイルに変更があった場合、ブラウザを更新する
	gulp.watch('./product/**/*', browserReload)
})


// ----------------------------------------
//		実行するタスクの順序を定義 (タスク群の下部必須)
// ----------------------------------------

// 最初に実行されるタスク名をdefaultとする
// parallel内のタスクを同時に実行する
// seriesはA>Bの順序
gulp.task('default', gulp.parallel('pugWatch', 'scssWatch', gulp.series('serve', 'browserWatch')))
