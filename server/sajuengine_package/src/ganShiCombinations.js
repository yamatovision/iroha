"use strict";
/**
 * 干合・支合の処理を行うモジュール
 * 四柱推命における干合（天干の組み合わせ）と支合（地支の組み合わせ）の
 * 変化ルールを実装
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processStemCombinations = processStemCombinations;
exports.processBranchCombinations = processBranchCombinations;
exports.applyGanShiCombinations = applyGanShiCombinations;
var tenGodCalculator_1 = require("./tenGodCalculator");
/**
 * 干合のペア定義
 * 各天干が干合を起こす相手の天干
 */
var GAN_COMBINATION_PAIRS = {
    '甲': '己',
    '己': '甲',
    '乙': '庚',
    '庚': '乙',
    '丙': '辛',
    '辛': '丙',
    '丁': '壬',
    '壬': '丁',
    '戊': '癸',
    '癸': '戊'
};
/**
 * 干合による変化後の天干
 * 特定の天干が干合によって変化する先の天干
 */
var GAN_COMBINATION_TRANSFORM = {
    '甲': '戊', // 甲が己と干合すると甲は戊に変化
    '乙': '辛', // 乙が庚と干合すると乙は辛に変化
    '丙': '壬', // 丙が辛と干合すると丙は壬に変化
    '丁': '乙', // 丁が壬と干合すると丁は乙に変化
    '壬': '甲', // 丁が壬と干合すると壬は甲に変化
    '戊': '丙', // 戊が癸と干合すると戊は丙に変化
    '癸': '丁' // 戊が癸と干合すると癸は丁に変化
};
/**
 * 支合のペア定義
 * 各地支が支合を起こす相手の地支
 */
var ZHI_COMBINATION_PAIRS = {
    '子': '丑',
    '丑': '子',
    '寅': '亥',
    '亥': '寅',
    '卯': '戌',
    '戌': '卯',
    '辰': '酉',
    '酉': '辰',
    '巳': '申',
    '申': '巳',
    '午': '未',
    '未': '午'
};
/**
 * 支合による五行の変化
 * 特定の地支ペアが支合によって強まる五行
 */
var ZHI_COMBINATION_ELEMENT = {
    '子丑': '土', // 子と丑が支合すると土の力量が強まる
    '寅亥': '木', // 寅と亥が支合すると木の力量が強まる
    '卯戌': '火', // 卯と戌が支合すると火の力量が強まる
    '辰酉': '金', // 辰と酉が支合すると金の力量が強まる
    '巳申': '水', // 巳と申が支合すると水の力量が強まる
    '午未': '火' // 午と未が支合すると火の力量が強まる
};
/**
 * 支冲の組み合わせ
 * 各地支と反発し合う関係にある地支
 */
var ZHI_CONFLICT_PAIRS = {
    '子': '午',
    '午': '子',
    '丑': '未',
    '未': '丑',
    '寅': '申',
    '申': '寅',
    '卯': '酉',
    '酉': '卯',
    '辰': '戌',
    '戌': '辰',
    '巳': '亥',
    '亥': '巳'
};
/**
 * 干合の判定と変化を処理
 * 隣接する天干間の干合を検出し、条件に合致する場合に変化を適用
 *
 * @param stems 四柱の天干の配列 [年柱天干, 月柱天干, 日柱天干, 時柱天干]
 * @param branches 四柱の地支の配列 [年柱地支, 月柱地支, 日柱地支, 時柱地支]
 * @returns 干合変化後の天干の配列
 */
function processStemCombinations(stems, branches) {
    // 結果の天干配列（初期値は変化なし）
    var resultStems = __spreadArray([], stems, true);
    // 隣接する柱間（年-月, 月-日, 日-時）の干合をチェック
    for (var i = 0; i < 3; i++) {
        var stem1 = resultStems[i];
        var stem2 = resultStems[i + 1];
        // 天干が干合ペアの関係にあるか確認
        if (GAN_COMBINATION_PAIRS[stem1] === stem2) {
            console.log("\u5E72\u5408\u691C\u51FA: ".concat(stem1).concat(stem2));
            // 姻合（妬合）の判定 - 両側から干合を受ける天干があれば変化しない
            if (i < 2 && GAN_COMBINATION_PAIRS[stem2] === resultStems[i + 2]) {
                console.log("  ".concat(stem2, "\u306F\u59FB\u5408\u72B6\u614B\u306E\u305F\u3081\u5909\u5316\u3057\u307E\u305B\u3093"));
                continue;
            }
            if (i > 0 && GAN_COMBINATION_PAIRS[stem1] === resultStems[i - 1]) {
                console.log("  ".concat(stem1, "\u306F\u59FB\u5408\u72B6\u614B\u306E\u305F\u3081\u5909\u5316\u3057\u307E\u305B\u3093"));
                continue;
            }
            // プラスαの変化条件チェック
            var monthBranchIndex = 1; // 月柱の地支のインデックス
            var monthBranch = branches[monthBranchIndex];
            // 1. 甲己の干合 - 月支に土の気が多く、木の気が無いことが条件
            if ((stem1 === '甲' && stem2 === '己') || (stem1 === '己' && stem2 === '甲')) {
                var monthElement = (0, tenGodCalculator_1.getElementFromBranch)(monthBranch);
                var hasWoodElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '木' && s !== '甲'; });
                if (monthElement === '土' ||
                    ['丑', '辰', '未', '戌'].includes(monthBranch)) {
                    if (!hasWoodElement) {
                        // 甲が変化
                        if (stem1 === '甲')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '甲')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        console.log("  \u7532\u5DF1\u5408\u5316\u571F: \u7532\u2192\u620A (\u5DF1\u306F\u4E0D\u5909)");
                    }
                }
            }
            // 2. 乙庚の干合 - 月支に金の気が多く、火の気が無いことが条件
            else if ((stem1 === '乙' && stem2 === '庚') || (stem1 === '庚' && stem2 === '乙')) {
                var monthElement = (0, tenGodCalculator_1.getElementFromBranch)(monthBranch);
                var hasFireElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '火'; });
                if (monthElement === '金' ||
                    ['申', '酉'].includes(monthBranch)) {
                    if (!hasFireElement) {
                        // 乙が変化
                        if (stem1 === '乙')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '乙')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        console.log("  \u4E59\u5E9A\u5408\u5316\u91D1: \u4E59\u2192\u8F9B (\u5E9A\u306F\u4E0D\u5909)");
                    }
                }
            }
            // 3. 丙辛の干合 - 月支に水の気が多く、土の気が無いことが条件
            else if ((stem1 === '丙' && stem2 === '辛') || (stem1 === '辛' && stem2 === '丙')) {
                var monthElement = (0, tenGodCalculator_1.getElementFromBranch)(monthBranch);
                var hasEarthElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '土'; });
                if (monthElement === '水' ||
                    ['子', '亥'].includes(monthBranch)) {
                    if (!hasEarthElement) {
                        // 丙が変化
                        if (stem1 === '丙')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '丙')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        console.log("  \u4E19\u8F9B\u5408\u5316\u6C34: \u4E19\u2192\u58EC (\u8F9B\u306F\u4E0D\u5909)");
                    }
                }
            }
            // 4. 丁壬の干合 - 月支に木の気が多く、金の気が無いことが条件
            else if ((stem1 === '丁' && stem2 === '壬') || (stem1 === '壬' && stem2 === '丁')) {
                var monthElement = (0, tenGodCalculator_1.getElementFromBranch)(monthBranch);
                var hasMetalElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '金'; });
                if (monthElement === '木' ||
                    ['寅', '卯'].includes(monthBranch)) {
                    if (!hasMetalElement) {
                        // 丁と壬が変化
                        if (stem1 === '丁')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '丁')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        if (stem1 === '壬')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '壬')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        console.log("  \u4E01\u58EC\u5408\u5316\u6728: \u4E01\u2192\u4E59, \u58EC\u2192\u7532");
                    }
                }
            }
            // 5. 戊癸の干合 - 月支に火の気が多く、水の気が無いことが条件
            else if ((stem1 === '戊' && stem2 === '癸') || (stem1 === '癸' && stem2 === '戊')) {
                var monthElement = (0, tenGodCalculator_1.getElementFromBranch)(monthBranch);
                var hasWaterElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '水' && s !== '癸'; });
                if (monthElement === '火' ||
                    ['巳', '午'].includes(monthBranch)) {
                    if (!hasWaterElement) {
                        // 戊と癸が変化
                        if (stem1 === '戊')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '戊')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        if (stem1 === '癸')
                            resultStems[i] = GAN_COMBINATION_TRANSFORM[stem1];
                        if (stem2 === '癸')
                            resultStems[i + 1] = GAN_COMBINATION_TRANSFORM[stem2];
                        console.log("  \u620A\u7678\u5408\u5316\u706B: \u620A\u2192\u4E19, \u7678\u2192\u4E01");
                    }
                }
            }
        }
    }
    return resultStems;
}
/**
 * 支合の判定と変化を処理
 * 隣接する地支間の支合を検出し、条件に合致する場合に五行の変化を適用
 *
 * @param branches 四柱の地支の配列 [年柱地支, 月柱地支, 日柱地支, 時柱地支]
 * @param stems 四柱の天干の配列 [年柱天干, 月柱天干, 日柱天干, 時柱天干]
 * @returns 支合変化後の情報（地支の配列と強化された五行の配列）
 */
function processBranchCombinations(branches, stems) {
    // 結果の地支配列（初期値は変化なし）
    var resultBranches = __spreadArray([], branches, true);
    // 強化された五行配列（初期値は各地支の通常の五行）
    var enhancedElements = branches.map(function (branch) { return (0, tenGodCalculator_1.getElementFromBranch)(branch); });
    // 変化フラグ配列
    var hasChanged = branches.map(function () { return false; });
    // 隣接する柱間（年-月, 月-日, 日-時）の支合をチェック
    for (var i = 0; i < 3; i++) {
        var branch1 = resultBranches[i];
        var branch2 = resultBranches[i + 1];
        // 地支が支合ペアの関係にあるか確認
        if (ZHI_COMBINATION_PAIRS[branch1] === branch2) {
            console.log("\u652F\u5408\u691C\u51FA: ".concat(branch1).concat(branch2));
            // 支冲（地支の対立関係）があると支合が打ち消される
            var nextIndex = i + 2;
            if (nextIndex < 4) {
                var nextBranch = resultBranches[nextIndex];
                if (ZHI_CONFLICT_PAIRS[branch1] === nextBranch || ZHI_CONFLICT_PAIRS[branch2] === nextBranch) {
                    console.log("  \u652F\u51B2\u304C\u3042\u308B\u305F\u3081\u652F\u5408\u52B9\u679C\u304C\u6253\u3061\u6D88\u3055\u308C\u307E\u3059");
                    continue;
                }
            }
            var prevIndex = i - 1;
            if (prevIndex >= 0) {
                var prevBranch = resultBranches[prevIndex];
                if (ZHI_CONFLICT_PAIRS[branch1] === prevBranch || ZHI_CONFLICT_PAIRS[branch2] === prevBranch) {
                    console.log("  \u652F\u51B2\u304C\u3042\u308B\u305F\u3081\u652F\u5408\u52B9\u679C\u304C\u6253\u3061\u6D88\u3055\u308C\u307E\u3059");
                    continue;
                }
            }
            // 1つの地支が両隣から支合を受ける場合（姻合に似た状態）は効果が打ち消される
            if (i < 2 && i > 0) {
                var branch3 = resultBranches[i + 2];
                if (ZHI_COMBINATION_PAIRS[branch2] === branch3) {
                    console.log("  ".concat(branch2, "\u306F\u4E21\u96A3\u304B\u3089\u652F\u5408\u3092\u53D7\u3051\u308B\u305F\u3081\u52B9\u679C\u304C\u6253\u3061\u6D88\u3055\u308C\u307E\u3059"));
                    continue;
                }
                var branch0 = resultBranches[i - 1];
                if (ZHI_COMBINATION_PAIRS[branch1] === branch0) {
                    console.log("  ".concat(branch1, "\u306F\u4E21\u96A3\u304B\u3089\u652F\u5408\u3092\u53D7\u3051\u308B\u305F\u3081\u52B9\u679C\u304C\u6253\u3061\u6D88\u3055\u308C\u307E\u3059"));
                    continue;
                }
            }
            // 支合による五行の強化処理
            // 支合ペアを順序正規化（例:「丑子」→「子丑」）
            var sortedPair = [branch1, branch2].sort().join('');
            var combinedElement = ZHI_COMBINATION_ELEMENT[sortedPair];
            // プラスαの変化条件チェック
            var canTransform = false;
            var dayMaster = stems[2]; // 日主（日柱の天干）
            var dayMasterElement = (0, tenGodCalculator_1.getElementFromStem)(dayMaster);
            // 各支合タイプごとの条件チェック
            switch (sortedPair) {
                case '子丑': // 子丑合化土 - 天干に戊・己・丑・辰・未・戌があり、木の気がないこと
                    var hasEarthStem = stems.some(function (s) { return ['戊', '己'].includes(s); });
                    var hasWoodElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '木'; });
                    canTransform = hasEarthStem && !hasWoodElement;
                    break;
                case '亥寅': // 寅亥合化木 - 天干に甲・乙・寅・卯があり、金の気がないこと
                    var hasWoodStem = stems.some(function (s) { return ['甲', '乙'].includes(s); });
                    var hasMetalElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '金'; });
                    canTransform = hasWoodStem && !hasMetalElement;
                    break;
                case '卯戌': // 卯戌合化火 - 天干に丙・丁・巳・午があり、水の気がないこと
                    var hasFireStem = stems.some(function (s) { return ['丙', '丁'].includes(s); });
                    var hasWaterElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '水'; });
                    canTransform = hasFireStem && !hasWaterElement;
                    break;
                case '辰酉': // 辰酉合化金 - 天干に庚・辛・申・酉があり、火の気がないこと
                    var hasMetalStem = stems.some(function (s) { return ['庚', '辛'].includes(s); });
                    var hasFireElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '火'; });
                    canTransform = hasMetalStem && !hasFireElement;
                    break;
                case '巳申': // 巳申合化水 - 天干に壬・癸・子・亥があり、土の気がないこと
                    var hasWaterStem = stems.some(function (s) { return ['壬', '癸'].includes(s); });
                    var hasEarthElement = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '土'; });
                    canTransform = hasWaterStem && !hasEarthElement;
                    break;
                case '午未': // 午未合化火 - 天干に丙・丁・甲・乙があり、水の気がないこと
                    var hasFireOrWoodStem = stems.some(function (s) { return ['丙', '丁', '甲', '乙'].includes(s); });
                    var hasWaterElementIn午未 = stems.some(function (s) { return (0, tenGodCalculator_1.getElementFromStem)(s) === '水'; });
                    canTransform = hasFireOrWoodStem && !hasWaterElementIn午未;
                    break;
            }
            if (canTransform && combinedElement) {
                console.log("  \u652F\u5408\u5909\u5316\u6761\u4EF6\u3092\u6E80\u305F\u3057\u3066\u3044\u307E\u3059: ".concat(branch1).concat(branch2, "\u5408\u5316").concat(combinedElement));
                // 五行の強化を適用
                enhancedElements[i] = combinedElement;
                enhancedElements[i + 1] = combinedElement;
                // 変化フラグを設定
                hasChanged[i] = true;
                hasChanged[i + 1] = true;
            }
            else {
                console.log("  \u652F\u5408\u5909\u5316\u6761\u4EF6\u3092\u6E80\u305F\u3057\u3066\u3044\u307E\u305B\u3093");
            }
        }
    }
    return {
        branches: resultBranches,
        enhancedElements: enhancedElements,
        hasChanged: hasChanged
    };
}
/**
 * 四柱に干合・支合の処理を適用
 *
 * @param fourPillars 元の四柱
 * @returns 干合・支合処理後の四柱
 */
function applyGanShiCombinations(fourPillars) {
    // 元の四柱から天干と地支を抽出
    var stems = [
        fourPillars.yearPillar.stem,
        fourPillars.monthPillar.stem,
        fourPillars.dayPillar.stem,
        fourPillars.hourPillar.stem
    ];
    var branches = [
        fourPillars.yearPillar.branch,
        fourPillars.monthPillar.branch,
        fourPillars.dayPillar.branch,
        fourPillars.hourPillar.branch
    ];
    console.log('干合・支合処理開始:');
    console.log('  元の四柱:', "".concat(stems[0]).concat(branches[0], " ").concat(stems[1]).concat(branches[1], " ").concat(stems[2]).concat(branches[2], " ").concat(stems[3]).concat(branches[3]));
    // 干合の処理
    var transformedStems = processStemCombinations(stems, branches);
    // 支合の処理
    var branchResult = processBranchCombinations(branches, transformedStems);
    // 処理結果を四柱に適用
    var result = __assign(__assign({}, fourPillars), { yearPillar: __assign(__assign({}, fourPillars.yearPillar), { stem: transformedStems[0], enhancedElement: branchResult.hasChanged[0] ? branchResult.enhancedElements[0] : undefined }), monthPillar: __assign(__assign({}, fourPillars.monthPillar), { stem: transformedStems[1], enhancedElement: branchResult.hasChanged[1] ? branchResult.enhancedElements[1] : undefined }), dayPillar: __assign(__assign({}, fourPillars.dayPillar), { stem: transformedStems[2], enhancedElement: branchResult.hasChanged[2] ? branchResult.enhancedElements[2] : undefined }), hourPillar: __assign(__assign({}, fourPillars.hourPillar), { stem: transformedStems[3], enhancedElement: branchResult.hasChanged[3] ? branchResult.enhancedElements[3] : undefined }) });
    // 各柱の天干に変化があった場合、fullStemBranchを更新
    if (transformedStems[0] !== stems[0]) {
        result.yearPillar.fullStemBranch = transformedStems[0] + branches[0];
    }
    if (transformedStems[1] !== stems[1]) {
        result.monthPillar.fullStemBranch = transformedStems[1] + branches[1];
    }
    if (transformedStems[2] !== stems[2]) {
        result.dayPillar.fullStemBranch = transformedStems[2] + branches[2];
    }
    if (transformedStems[3] !== stems[3]) {
        result.hourPillar.fullStemBranch = transformedStems[3] + branches[3];
    }
    console.log('干合・支合処理後:');
    console.log('  変換後の四柱:', "".concat(transformedStems[0]).concat(branches[0], " ").concat(transformedStems[1]).concat(branches[1], " ").concat(transformedStems[2]).concat(branches[2], " ").concat(transformedStems[3]).concat(branches[3]));
    return result;
}
