"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateKoreanYearStemIndex = calculateKoreanYearStemIndex;
exports.calculateKoreanYearBranchIndex = calculateKoreanYearBranchIndex;
exports.calculateKoreanYearPillar = calculateKoreanYearPillar;
exports.getHiddenStems = getHiddenStems;
exports.verifyKoreanYearPillarCalculation = verifyKoreanYearPillarCalculation;
exports.runKoreanYearPillarTest = runKoreanYearPillarTest;
/**
 * 韓国式四柱推命 - 年柱計算モジュール (一般アルゴリズム)
 * calender.mdのサンプルデータを分析して抽出したアルゴリズム
 */
var types_1 = require("./types");
/**
 * 年干（天干）を計算する - 韓国式
 * @param year 西暦年
 * @return 天干のインデックス (0-9)
 */
function calculateKoreanYearStemIndex(year) {
    // calender.mdの分析結果に基づく韓国式計算
    // 1984年は甲子年（甲=0）という参照点から調整
    return (year - 4) % 10;
}
/**
 * 年支（地支）を計算する - 韓国式
 * @param year 西暦年
 * @return 地支のインデックス (0-11)
 */
function calculateKoreanYearBranchIndex(year) {
    // calender.mdの分析結果に基づく韓国式計算
    // 1986年は丙寅年（寅=2）という参照点から調整
    return (year - 4) % 12;
}
/**
 * 韓国式年柱計算 - サンプルデータから抽出した一般アルゴリズム
 * @param year 西暦年
 * @returns 年柱情報
 */
function calculateKoreanYearPillar(year) {
    // 天干インデックス: (年 + 6) % 10
    var stemIndex = calculateKoreanYearStemIndex(year);
    // 地支インデックス: 年 % 12
    var branchIndex = calculateKoreanYearBranchIndex(year);
    var stem = types_1.STEMS[stemIndex];
    var branch = types_1.BRANCHES[branchIndex];
    return {
        stem: stem,
        branch: branch,
        fullStemBranch: "".concat(stem).concat(branch)
    };
}
/**
 * 地支から蔵干（隠れた天干）を取得
 * @param branch 地支
 * @returns 蔵干の配列
 */
function getHiddenStems(branch) {
    // 各地支に対応する蔵干のマッピング
    var hiddenStemsMap = {
        "子": ["癸"],
        "丑": ["己", "辛", "癸"],
        "寅": ["甲", "丙", "戊"],
        "卯": ["乙"],
        "辰": ["戊", "乙", "癸"],
        "巳": ["丙", "庚", "戊"],
        "午": ["丁", "己"],
        "未": ["己", "乙", "丁"],
        "申": ["庚", "壬", "戊"],
        "酉": ["辛"],
        "戌": ["戊", "辛", "丁"],
        "亥": ["壬", "甲"]
    };
    return hiddenStemsMap[branch] || [];
}
/**
 * サンプルデータを使って年柱計算を検証
 * @returns 検証結果
 */
function verifyKoreanYearPillarCalculation() {
    // サンプルデータ - calender.mdから抽出
    var samples = [
        { year: 1970, expected: "己酉", description: "白い鶏 (흰 닭)" },
        { year: 1985, expected: "乙丑", description: "木の牛 (나무 소)" },
        { year: 1995, expected: "乙亥", description: "木の猪 (나무 돼지)" },
        { year: 2005, expected: "乙酉", description: "木の鶏 (나무 닭)" },
        { year: 2015, expected: "乙未", description: "木の羊 (나무 양)" }
    ];
    // 追加の検証ケース
    var additionalSamples = [
        { year: 1986, expected: "丙寅", description: "火の虎 (붉은 호랑이)" },
        { year: 2023, expected: "癸卯", description: "水の兎 (검은 토끼)" },
        { year: 2024, expected: "甲辰", description: "木の龍 (푸른 용)" }
    ];
    var results = [];
    var allCorrect = true;
    // サンプルデータの検証
    console.log('===== 韓国式年柱計算検証 - 基本サンプル =====');
    samples.forEach(function (sample) {
        var calculated = calculateKoreanYearPillar(sample.year);
        var isCorrect = calculated.fullStemBranch === sample.expected;
        if (!isCorrect)
            allCorrect = false;
        results.push({
            year: sample.year,
            expected: sample.expected,
            calculated: calculated.fullStemBranch,
            correct: isCorrect
        });
        console.log("".concat(sample.year, "\u5E74: \u671F\u5F85\u5024[").concat(sample.expected, " - ").concat(sample.description, "] \u8A08\u7B97\u5024[").concat(calculated.fullStemBranch, "] - ").concat(isCorrect ? '✓' : '✗'));
    });
    // 追加サンプルの検証
    console.log('\n===== 韓国式年柱計算検証 - 追加サンプル =====');
    additionalSamples.forEach(function (sample) {
        var calculated = calculateKoreanYearPillar(sample.year);
        var isCorrect = calculated.fullStemBranch === sample.expected;
        if (!isCorrect)
            allCorrect = false;
        results.push({
            year: sample.year,
            expected: sample.expected,
            calculated: calculated.fullStemBranch,
            correct: isCorrect
        });
        console.log("".concat(sample.year, "\u5E74: \u671F\u5F85\u5024[").concat(sample.expected, " - ").concat(sample.description, "] \u8A08\u7B97\u5024[").concat(calculated.fullStemBranch, "] - ").concat(isCorrect ? '✓' : '✗'));
    });
    // アルゴリズム説明
    console.log('\n===== 韓国式年柱計算アルゴリズム =====');
    console.log('抽出したアルゴリズム:');
    console.log('1. 年干(天干): (年 + 6) % 10のインデックスで求める');
    console.log('2. 年支(地支): (年 % 12)のインデックスで求める');
    console.log("3. \u5929\u5E72\u306E\u914D\u5217: [".concat(types_1.STEMS.join(', '), "]"));
    console.log("4. \u5730\u652F\u306E\u914D\u5217: [".concat(types_1.BRANCHES.join(', '), "]"));
    return {
        success: allCorrect,
        results: results
    };
}
/**
 * 韓国式年柱計算のテスト実行
 */
function runKoreanYearPillarTest() {
    var verification = verifyKoreanYearPillarCalculation();
    console.log("\n\u691C\u8A3C\u7D50\u679C: ".concat(verification.success ? '成功' : '失敗'));
    if (!verification.success) {
        console.log('\n失敗したケース:');
        verification.results
            .filter(function (result) { return !result.correct; })
            .forEach(function (result) {
            console.log("- ".concat(result.year, "\u5E74: \u671F\u5F85\u5024[").concat(result.expected, "] \u8A08\u7B97\u5024[").concat(result.calculated, "]"));
        });
    }
    // 過去60年間の年柱パターンを表示
    console.log('\n===== 過去60年間の韓国式年柱パターン =====');
    var currentYear = new Date().getFullYear();
    for (var i = 0; i < 60; i++) {
        var year = currentYear - 59 + i;
        var pillar = calculateKoreanYearPillar(year);
        console.log("".concat(year, "\u5E74: ").concat(pillar.fullStemBranch));
    }
}
// このファイルを直接実行した場合のみテストを実行
if (require.main === module) {
    runKoreanYearPillarTest();
}
