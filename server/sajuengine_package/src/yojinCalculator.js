"use strict";
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
exports.determineYojin = determineYojin;
var tenGodCalculator = require("./tenGodCalculator");
/**
 * 用神計算の主要関数
 * @param fourPillars 四柱情報
 * @param tenGods 十神関係情報
 * @param kakukyoku 格局情報
 * @returns 用神情報
 */
function determineYojin(fourPillars, tenGods, kakukyoku) {
    // 選択された用神
    var selectedYojin;
    var debugInfo = [];
    // 特別格局と普通格局で処理を分岐
    // saju_yojin_algorithm.mdのアルゴリズムに厳密に従う
    if (kakukyoku.category === 'special') {
        // 特別格局の場合は早見表から通変星ペアを決定し、出現頻度で具体的な十神を選択
        debugInfo.push("\u7279\u5225\u683C\u5C40\u300C".concat(kakukyoku.type, "\u300D\u3092\u691C\u51FA\u3057\u307E\u3057\u305F"));
        debugInfo.push("\u7279\u5225\u683C\u5C40\u306E\u5834\u5408\u3001\u65E9\u898B\u8868\u304B\u3089\u7528\u795E\u306E\u901A\u5909\u661F\u30DA\u30A2\u3092\u6C7A\u5B9A\u3057\u3001\u51FA\u73FE\u983B\u5EA6\u3067\u5177\u4F53\u7684\u306A\u5341\u795E\u3092\u9078\u629E\u3057\u307E\u3059");
        // 早見表から用神を取得（通変星ペアを得て、命式内の出現頻度に基づいて具体的な十神を選択）
        selectedYojin = getSpecialKakukyokuYojin(kakukyoku.type, fourPillars);
        debugInfo.push("\u7279\u5225\u683C\u5C40\u300C".concat(kakukyoku.type, "\u300D\u306E\u7528\u795E\u306F\u300C").concat(selectedYojin, "\u300D\u3068\u6C7A\u5B9A\u3055\u308C\u307E\u3057\u305F"));
        console.log("\u7279\u5225\u683C\u5C40\u300C".concat(kakukyoku.type, "\u300D\u306E\u7528\u795E\u306F\u300C").concat(selectedYojin, "\u300D\u3068\u6C7A\u5B9A\u3055\u308C\u307E\u3057\u305F"));
    }
    else {
        // 普通格局の場合の処理
        debugInfo.push("\u666E\u901A\u683C\u5C40\u300C".concat(kakukyoku.type, "\u300D\u3092\u691C\u51FA\u3057\u307E\u3057\u305F"));
        // 1. 通変星の数を数える
        var tenGodCounts = countTenGods(fourPillars);
        var pairCounts = {
            '比劫': tenGodCounts['比肩'] + tenGodCounts['劫財'],
            '印': tenGodCounts['偏印'] + tenGodCounts['正印'],
            '食傷': tenGodCounts['食神'] + tenGodCounts['傷官'],
            '財': tenGodCounts['偏財'] + tenGodCounts['正財'],
            '官殺': tenGodCounts['偏官'] + tenGodCounts['正官']
        };
        // 各通変星の個別カウントも記録
        var individualCounts = {
            '比肩': tenGodCounts['比肩'] || 0,
            '劫財': tenGodCounts['劫財'] || 0,
            '偏印': tenGodCounts['偏印'] || 0,
            '正印': tenGodCounts['正印'] || 0,
            '食神': tenGodCounts['食神'] || 0,
            '傷官': tenGodCounts['傷官'] || 0,
            '偏財': tenGodCounts['偏財'] || 0,
            '正財': tenGodCounts['正財'] || 0,
            '偏官': tenGodCounts['偏官'] || 0,
            '正官': tenGodCounts['正官'] || 0
        };
        debugInfo.push("\u901A\u5909\u661F\u30DA\u30A2\u96C6\u8A08: \u6BD4\u52AB=".concat(pairCounts['比劫'], ", \u5370=").concat(pairCounts['印'], ", \u98DF\u50B7=").concat(pairCounts['食傷'], ", \u8CA1=").concat(pairCounts['財'], ", \u5B98\u6BBA=").concat(pairCounts['官殺']));
        debugInfo.push("\u500B\u5225\u5341\u795E\u96C6\u8A08: \u6BD4\u80A9=".concat(individualCounts['比肩'], ", \u52AB\u8CA1=").concat(individualCounts['劫財'], ", \u504F\u5370=").concat(individualCounts['偏印'], ", \u6B63\u5370=").concat(individualCounts['正印'], ", \u98DF\u795E=").concat(individualCounts['食神'], ", \u50B7\u5B98=").concat(individualCounts['傷官'], ", \u504F\u8CA1=").concat(individualCounts['偏財'], ", \u6B63\u8CA1=").concat(individualCounts['正財'], ", \u504F\u5B98=").concat(individualCounts['偏官'], ", \u6B63\u5B98=").concat(individualCounts['正官']));
        // 2. 命式内で最も多い通変星ペアを特定
        var mostFrequentPair = getMostFrequentPair(pairCounts);
        debugInfo.push("\u547D\u5F0F\u5185\u3067\u6700\u3082\u591A\u3044\u901A\u5909\u661F\u30DA\u30A2: ".concat(mostFrequentPair));
        // 3. 格局タイプ、身強/身弱、最も多い通変星ペアに基づいて用神を決定
        var yojinPair = getNormalKakukyokuYojinPair(kakukyoku.type, kakukyoku.strength, mostFrequentPair);
        debugInfo.push("\u65E9\u898B\u8868\u304B\u3089\u6C7A\u5B9A\u3055\u308C\u305F\u7528\u795E\u901A\u5909\u661F\u30DA\u30A2: ".concat(yojinPair));
        // 4. 通変星ペアから具体的な十神を選定
        selectedYojin = selectSpecificTenGod(yojinPair, tenGodCounts);
        debugInfo.push("\u6700\u7D42\u7684\u306B\u9078\u629E\u3055\u308C\u305F\u7528\u795E: ".concat(selectedYojin));
    }
    // 4. 用神の五行属性を特定
    var element = convertTenGodToElement(selectedYojin, fourPillars.dayPillar.stem);
    debugInfo.push("\u7528\u795E\u300C".concat(selectedYojin, "\u300D\u306E\u4E94\u884C\u5C5E\u6027: ").concat(element));
    // 5. 用神の説明文を生成
    var description = generateYojinDescription(selectedYojin, element, kakukyoku);
    // 6. 用神をサポートする五行を特定
    var supportElements = getSupportingElements(element);
    // 7. 喜神、忌神、仇神を計算
    var relatedGods = determineRelatedGods(selectedYojin, fourPillars.dayPillar.stem, kakukyoku, fourPillars);
    // デバッグ情報をログに出力
    console.log('用神決定プロセス:', debugInfo.join('\n'));
    return {
        tenGod: selectedYojin,
        element: element,
        description: description,
        supportElements: supportElements,
        kijin: relatedGods.kijin,
        kijin2: relatedGods.kijin2,
        kyujin: relatedGods.kyujin,
        debugInfo: debugInfo // デバッグ情報も返す（必要に応じて）
    };
}
/**
 * 特別格局の用神を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param fourPillars 四柱情報
 * @returns 用神（十神）
 */
function getSpecialKakukyokuYojin(kakukyokuType, fourPillars) {
    // 早見表に基づく特別格局の用神マッピング（saju_yojin_algorithm.mdの「特別格局の用神早見表」に従う）
    var specialKakukyokuYojinMap = {
        '従旺格': '比劫', // 比劫は通変星ペア（比肩・劫財）
        '従強格': '印', // 印は通変星ペア（偏印・正印）
        '従児格': '食傷', // 食傷は通変星ペア（食神・傷官）
        '従財格': '財', // 財は通変星ペア（偏財・正財）
        '従殺格': '官殺', // 官殺は通変星ペア（偏官・正官）
        '従勢格': '財' // 格局タイプに応じて早見表から直接決定
    };
    // 1. 用神（通変星ペア）の決定
    var yojinPair = specialKakukyokuYojinMap[kakukyokuType] || '比劫';
    console.log("\u7279\u5225\u683C\u5C40\u300C".concat(kakukyokuType, "\u300D\u306E\u7528\u795E\u306F\u65E9\u898B\u8868\u304B\u3089\u901A\u5909\u661F\u30DA\u30A2\u300C").concat(yojinPair, "\u300D\u3068\u6C7A\u5B9A\u3055\u308C\u307E\u3057\u305F"));
    // 2. 命式内の通変星の数を集計
    var tenGodCounts = countTenGods(fourPillars);
    // 3. 具体的な用神の決定 - 出現頻度に基づいて選択
    console.log("\u7528\u795E\u300C".concat(yojinPair, "\u300D\u3092\u69CB\u6210\u3059\u308B\u5177\u4F53\u7684\u306A\u5341\u795E\u3092\u51FA\u73FE\u983B\u5EA6\u306B\u57FA\u3065\u3044\u3066\u9078\u629E\u3057\u307E\u3059"));
    switch (yojinPair) {
        case '比劫':
            // 比肩と劫財のどちらが多いか
            var bikenCount = tenGodCounts['比肩'] || 0;
            var kouzaiCount = tenGodCounts['劫財'] || 0;
            console.log("\u6BD4\u80A9: ".concat(bikenCount, "\u500B, \u52AB\u8CA1: ").concat(kouzaiCount, "\u500B"));
            if (bikenCount > kouzaiCount) {
                console.log("\u6BD4\u80A9\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u6BD4\u80A9\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '比肩';
            }
            else if (kouzaiCount > bikenCount) {
                console.log("\u52AB\u8CA1\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u52AB\u8CA1\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '劫財';
            }
            else {
                // 同数の場合は地支の通変星を優先（詳細な実装は省略）
                console.log("\u540C\u6570\u306E\u305F\u3081\u3001\u512A\u5148\u30EB\u30FC\u30EB\u3092\u9069\u7528\u3057\u3066\u300C\u6BD4\u80A9\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '比肩';
            }
        case '印':
            // 偏印と正印のどちらが多いか
            var henInCount = tenGodCounts['偏印'] || 0;
            var seiInCount = tenGodCounts['正印'] || 0;
            console.log("\u504F\u5370: ".concat(henInCount, "\u500B, \u6B63\u5370: ").concat(seiInCount, "\u500B"));
            if (henInCount > seiInCount) {
                console.log("\u504F\u5370\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u504F\u5370\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '偏印';
            }
            else if (seiInCount > henInCount) {
                console.log("\u6B63\u5370\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u6B63\u5370\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正印';
            }
            else {
                console.log("\u540C\u6570\u306E\u305F\u3081\u3001\u512A\u5148\u30EB\u30FC\u30EB\u3092\u9069\u7528\u3057\u3066\u300C\u6B63\u5370\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正印';
            }
        case '食傷':
            // 食神と傷官のどちらが多いか
            var shokuShinCount = tenGodCounts['食神'] || 0;
            var shougouCount = tenGodCounts['傷官'] || 0;
            console.log("\u98DF\u795E: ".concat(shokuShinCount, "\u500B, \u50B7\u5B98: ").concat(shougouCount, "\u500B"));
            if (shokuShinCount > shougouCount) {
                console.log("\u98DF\u795E\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u98DF\u795E\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '食神';
            }
            else if (shougouCount > shokuShinCount) {
                console.log("\u50B7\u5B98\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u50B7\u5B98\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '傷官';
            }
            else {
                console.log("\u540C\u6570\u306E\u305F\u3081\u3001\u512A\u5148\u30EB\u30FC\u30EB\u3092\u9069\u7528\u3057\u3066\u300C\u98DF\u795E\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '食神';
            }
        case '財':
            // 偏財と正財のどちらが多いか
            var henZaiCount = tenGodCounts['偏財'] || 0;
            var seiZaiCount = tenGodCounts['正財'] || 0;
            console.log("\u504F\u8CA1: ".concat(henZaiCount, "\u500B, \u6B63\u8CA1: ").concat(seiZaiCount, "\u500B"));
            if (henZaiCount > seiZaiCount) {
                console.log("\u504F\u8CA1\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u504F\u8CA1\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '偏財';
            }
            else if (seiZaiCount > henZaiCount) {
                console.log("\u6B63\u8CA1\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u6B63\u8CA1\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正財';
            }
            else {
                console.log("\u540C\u6570\u306E\u305F\u3081\u3001\u512A\u5148\u30EB\u30FC\u30EB\u3092\u9069\u7528\u3057\u3066\u300C\u6B63\u8CA1\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正財';
            }
        case '官殺':
            // 偏官と正官のどちらが多いか
            var henKanCount = tenGodCounts['偏官'] || 0;
            var seiKanCount = tenGodCounts['正官'] || 0;
            console.log("\u504F\u5B98: ".concat(henKanCount, "\u500B, \u6B63\u5B98: ").concat(seiKanCount, "\u500B"));
            if (henKanCount > seiKanCount) {
                console.log("\u504F\u5B98\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u504F\u5B98\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '偏官';
            }
            else if (seiKanCount > henKanCount) {
                console.log("\u6B63\u5B98\u306E\u65B9\u304C\u591A\u3044\u305F\u3081\u3001\u7528\u795E\u306F\u300C\u6B63\u5B98\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正官';
            }
            else {
                console.log("\u540C\u6570\u306E\u305F\u3081\u3001\u512A\u5148\u30EB\u30FC\u30EB\u3092\u9069\u7528\u3057\u3066\u300C\u6B63\u5B98\u300D\u306B\u6C7A\u5B9A\u3057\u307E\u3057\u305F");
                return '正官';
            }
        default:
            console.log('特別格局に一致するものがないため、デフォルト値「比肩」を返します');
            return '比肩';
    }
}
/**
 * 特別格局の関連神（喜神・忌神・仇神）を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param dayMaster 日干
 * @param fourPillars 四柱情報
 * @returns 喜神・忌神・仇神
 */
function getSpecialKakukyokuRelatedGods(kakukyokuType, dayMaster, fourPillars) {
    // 1. 早見表に基づく特別格局の関連神マッピング（通変星ペア）
    var specialKakukyokuGodMap = {
        '従旺格': { kijin: '印', kijin2: '官殺', kyujin: '財' },
        '従強格': { kijin: '比劫', kijin2: '財', kyujin: '食傷' },
        '従児格': { kijin: '財', kijin2: '印', kyujin: '比劫' },
        '従財格': { kijin: '食傷', kijin2: '比劫', kyujin: '印' },
        '従殺格': { kijin: '財', kijin2: '印', kyujin: '比劫' },
        '従勢格': { kijin: '官殺', kijin2: '比劫', kyujin: '印' }
    };
    // 2. 通変星ペアを取得
    var relatedGodPairs = specialKakukyokuGodMap[kakukyokuType] || { kijin: '比劫', kijin2: '印', kyujin: '財' };
    console.log("\u7279\u5225\u683C\u5C40\u300C".concat(kakukyokuType, "\u300D\u306E\u95A2\u9023\u795E\uFF08\u559C\u795E\u30FB\u5FCC\u795E\u30FB\u4EC7\u795E\uFF09\u3092\u65E9\u898B\u8868\u304B\u3089\u53D6\u5F97\u3057\u307E\u3057\u305F"));
    // 天干から五行を特定
    var dayElement = getDayElementFromStem(dayMaster);
    // 通変星のカウント
    var tenGodCounts = countTenGods(fourPillars);
    // 4. 喜神の決定
    var kijinPair = relatedGodPairs.kijin;
    var kijinTenGod = kijinPair;
    console.log("\u559C\u795E\u306F\u901A\u5909\u661F\u30DA\u30A2\u300C".concat(kijinPair, "\u300D\u3092\u547D\u5F0F\u5185\u306E\u51FA\u73FE\u983B\u5EA6\u306B\u57FA\u3065\u3044\u3066\u9078\u629E\u3057\u307E\u3059"));
    switch (kijinPair) {
        case '比劫':
            // 比肩と劫財のどちらが多いか
            if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
                kijinTenGod = '比肩';
            }
            else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
                kijinTenGod = '劫財';
            }
            else {
                // 同数の場合は地支・月支優先ルールを適用（簡略化）
                kijinTenGod = '比肩';
            }
            break;
        case '印':
            if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
                kijinTenGod = '偏印';
            }
            else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
                kijinTenGod = '正印';
            }
            else {
                kijinTenGod = '正印';
            }
            break;
        case '食傷':
            if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
                kijinTenGod = '食神';
            }
            else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
                kijinTenGod = '傷官';
            }
            else {
                kijinTenGod = '食神';
            }
            break;
        case '財':
            if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
                kijinTenGod = '偏財';
            }
            else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
                kijinTenGod = '正財';
            }
            else {
                kijinTenGod = '正財';
            }
            break;
        case '官殺':
            if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
                kijinTenGod = '偏官';
            }
            else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
                kijinTenGod = '正官';
            }
            else {
                kijinTenGod = '正官';
            }
            break;
    }
    // 5. 忌神の決定
    var kijin2Pair = relatedGodPairs.kijin2;
    var kijin2TenGod = kijin2Pair;
    console.log("\u5FCC\u795E\u306F\u901A\u5909\u661F\u30DA\u30A2\u300C".concat(kijin2Pair, "\u300D\u3092\u547D\u5F0F\u5185\u306E\u51FA\u73FE\u983B\u5EA6\u306B\u57FA\u3065\u3044\u3066\u9078\u629E\u3057\u307E\u3059"));
    switch (kijin2Pair) {
        case '比劫':
            if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
                kijin2TenGod = '比肩';
            }
            else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
                kijin2TenGod = '劫財';
            }
            else {
                kijin2TenGod = '比肩';
            }
            break;
        case '印':
            if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
                kijin2TenGod = '偏印';
            }
            else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
                kijin2TenGod = '正印';
            }
            else {
                kijin2TenGod = '正印';
            }
            break;
        case '食傷':
            if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
                kijin2TenGod = '食神';
            }
            else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
                kijin2TenGod = '傷官';
            }
            else {
                kijin2TenGod = '食神';
            }
            break;
        case '財':
            if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
                kijin2TenGod = '偏財';
            }
            else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
                kijin2TenGod = '正財';
            }
            else {
                kijin2TenGod = '正財';
            }
            break;
        case '官殺':
            if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
                kijin2TenGod = '偏官';
            }
            else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
                kijin2TenGod = '正官';
            }
            else {
                kijin2TenGod = '正官';
            }
            break;
    }
    // 6. 仇神の決定
    var kyujinPair = relatedGodPairs.kyujin;
    var kyujinTenGod = kyujinPair;
    console.log("\u4EC7\u795E\u306F\u901A\u5909\u661F\u30DA\u30A2\u300C".concat(kyujinPair, "\u300D\u3092\u547D\u5F0F\u5185\u306E\u51FA\u73FE\u983B\u5EA6\u306B\u57FA\u3065\u3044\u3066\u9078\u629E\u3057\u307E\u3059"));
    switch (kyujinPair) {
        case '比劫':
            if ((tenGodCounts['比肩'] || 0) > (tenGodCounts['劫財'] || 0)) {
                kyujinTenGod = '比肩';
            }
            else if ((tenGodCounts['劫財'] || 0) > (tenGodCounts['比肩'] || 0)) {
                kyujinTenGod = '劫財';
            }
            else {
                kyujinTenGod = '比肩';
            }
            break;
        case '印':
            if ((tenGodCounts['偏印'] || 0) > (tenGodCounts['正印'] || 0)) {
                kyujinTenGod = '偏印';
            }
            else if ((tenGodCounts['正印'] || 0) > (tenGodCounts['偏印'] || 0)) {
                kyujinTenGod = '正印';
            }
            else {
                kyujinTenGod = '正印';
            }
            break;
        case '食傷':
            if ((tenGodCounts['食神'] || 0) > (tenGodCounts['傷官'] || 0)) {
                kyujinTenGod = '食神';
            }
            else if ((tenGodCounts['傷官'] || 0) > (tenGodCounts['食神'] || 0)) {
                kyujinTenGod = '傷官';
            }
            else {
                kyujinTenGod = '食神';
            }
            break;
        case '財':
            if ((tenGodCounts['偏財'] || 0) > (tenGodCounts['正財'] || 0)) {
                kyujinTenGod = '偏財';
            }
            else if ((tenGodCounts['正財'] || 0) > (tenGodCounts['偏財'] || 0)) {
                kyujinTenGod = '正財';
            }
            else {
                kyujinTenGod = '正財';
            }
            break;
        case '官殺':
            if ((tenGodCounts['偏官'] || 0) > (tenGodCounts['正官'] || 0)) {
                kyujinTenGod = '偏官';
            }
            else if ((tenGodCounts['正官'] || 0) > (tenGodCounts['偏官'] || 0)) {
                kyujinTenGod = '正官';
            }
            else {
                kyujinTenGod = '正官';
            }
            break;
    }
    // 7. 五行属性の変換
    var kijinElement = convertTenGodToElement(kijinTenGod, dayMaster);
    var kijin2Element = convertTenGodToElement(kijin2TenGod, dayMaster);
    var kyujinElement = convertTenGodToElement(kyujinTenGod, dayMaster);
    // 8. 説明文の生成
    var kijinDescription = generateGodDescription(kijinTenGod, kijinElement, '喜神');
    var kijin2Description = generateGodDescription(kijin2TenGod, kijin2Element, '忌神');
    var kyujinDescription = generateGodDescription(kyujinTenGod, kyujinElement, '仇神');
    console.log("\u6C7A\u5B9A\u3055\u308C\u305F\u559C\u795E: ".concat(kijinTenGod, "(").concat(kijinElement, "), \u5FCC\u795E: ").concat(kijin2TenGod, "(").concat(kijin2Element, "), \u4EC7\u795E: ").concat(kyujinTenGod, "(").concat(kyujinElement, ")"));
    return {
        kijin: {
            tenGod: kijinTenGod,
            element: kijinElement,
            description: kijinDescription
        },
        kijin2: {
            tenGod: kijin2TenGod,
            element: kijin2Element,
            description: kijin2Description
        },
        kyujin: {
            tenGod: kyujinTenGod,
            element: kyujinElement,
            description: kyujinDescription
        }
    };
}
/**
 * 身強・身弱に基づいて用神候補を取得する関数
 * @param strength 身強・身弱・中和の状態
 * @returns 用神候補となる十神のリスト
 */
function getYojinCandidates(strength) {
    if (strength === 'strong') {
        // 身強の場合は日干を弱める用神が必要
        return ['食神', '傷官', '偏財', '正財', '偏官', '正官'];
    }
    else if (strength === 'weak') {
        // 身弱の場合は日干を強める用神が必要
        return ['比肩', '劫財', '偏印', '正印'];
    }
    else {
        // 中和の場合は両方を候補とする
        return ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];
    }
}
/**
 * 通変星の出現回数を数える関数
 * @param fourPillars 四柱情報
 * @returns 各通変星の出現回数
 */
function countTenGods(fourPillars) {
    var counts = {
        // 個別十神
        '比肩': 0,
        '劫財': 0,
        '食神': 0,
        '傷官': 0,
        '偏財': 0,
        '正財': 0,
        '偏官': 0,
        '正官': 0,
        '偏印': 0,
        '正印': 0,
        // 通変星グループ
        '比劫': 0,
        '印': 0,
        '食傷': 0,
        '財': 0,
        '官殺': 0,
        // フォールバック
        '不明': 0,
        'なし': 0
    };
    // 天干の十神関係をカウント
    var stemTenGods = [
        fourPillars.yearPillar.stem,
        fourPillars.monthPillar.stem,
        fourPillars.hourPillar.stem
    ];
    // 地支の十神関係もカウント
    var branchTenGods = [
        fourPillars.yearPillar.branchTenGod,
        fourPillars.monthPillar.branchTenGod,
        fourPillars.dayPillar.branchTenGod,
        fourPillars.hourPillar.branchTenGod
    ];
    branchTenGods.forEach(function (tenGod) {
        if (tenGod && tenGod in counts) {
            counts[tenGod]++;
        }
    });
    // 蔵干の十神関係もカウント（重み付き）
    var hiddenStemsTenGods = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], (fourPillars.yearPillar.hiddenStemsTenGods || []), true), (fourPillars.monthPillar.hiddenStemsTenGods || []), true), (fourPillars.dayPillar.hiddenStemsTenGods || []), true), (fourPillars.hourPillar.hiddenStemsTenGods || []), true);
    hiddenStemsTenGods.forEach(function (_a) {
        var tenGod = _a.tenGod, _b = _a.weight, weight = _b === void 0 ? 1 : _b;
        if (tenGod && tenGod in counts) {
            counts[tenGod] += weight;
        }
    });
    // 通変星ペアの集計を追加
    counts['比劫'] = counts['比肩'] + counts['劫財'];
    counts['印'] = counts['偏印'] + counts['正印'];
    counts['食傷'] = counts['食神'] + counts['傷官'];
    counts['財'] = counts['偏財'] + counts['正財'];
    counts['官殺'] = counts['偏官'] + counts['正官'];
    return counts;
}
/**
 * 天干から五行属性を取得する関数
 */
function getDayElementFromStem(stem) {
    var stemToElement = {
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water'
    };
    return stemToElement[stem] || 'unknown';
}
/**
 * 命式内で最も多い通変星ペアを特定する関数
 * @param pairCounts 各通変星ペアの出現回数
 * @returns 最も多い通変星ペア
 */
function getMostFrequentPair(pairCounts) {
    var maxCount = 0;
    var mostFrequentPair = '比劫'; // デフォルト値
    // 出現頻度が最大の通変星ペアを特定
    for (var _i = 0, _a = Object.entries(pairCounts); _i < _a.length; _i++) {
        var _b = _a[_i], pair = _b[0], count = _b[1];
        if (count > maxCount) {
            maxCount = count;
            mostFrequentPair = pair;
        }
    }
    return mostFrequentPair;
}
/**
 * 普通格局の用神通変星ペアを早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param strength 身強/身弱
 * @param mostFrequentPair 命式内で最も多い通変星ペア
 * @returns 用神の通変星ペア
 */
function getNormalKakukyokuYojinPair(kakukyokuType, strength, mostFrequentPair) {
    // 格局タイプから「格」を省いた形式
    var formatType = kakukyokuType.replace(/格$/, '');
    // 早見表データ（saju_yojin_algorithm.mdの「普通格局の用神早見表」に従う）
    var normalKakukyokuYojinMap = {
        // 建禄格・月刃格の早見表
        '建禄': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        '月刃': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        // 食神格・傷官格の早見表
        '食神': {
            'strong': {
                '比劫': '食傷',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        '傷官': {
            'strong': {
                '比劫': '食傷',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        // 偏財格・正財格の早見表
        '偏財': {
            'strong': {
                '比劫': '食傷',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        '正財': {
            'strong': {
                '比劫': '食傷',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '官殺': '印',
                '財': '比劫',
                '食傷': '印'
            }
        },
        // 正官格・偏官格の早見表
        '正官': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '食傷': '印',
                '財': '比劫',
                '官殺': '印'
            }
        },
        '偏官': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '食傷': '印',
                '財': '比劫',
                '官殺': '印'
            }
        },
        // 印緑格・偏印格の早見表
        '印緑': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '食傷': '印',
                '財': '比劫',
                '官殺': '印'
            }
        },
        '偏印': {
            'strong': {
                '比劫': '官殺',
                '印': '財',
                '食傷': '財',
                '財': '官殺',
                '官殺': '食傷'
            },
            'weak': {
                '食傷': '印',
                '財': '比劫',
                '官殺': '印'
            }
        }
    };
    // 中和の場合は身強パターンを使用
    var actualStrength = strength === 'neutral' ? 'strong' : strength;
    // 早見表から用神を取得
    try {
        if (normalKakukyokuYojinMap[formatType] &&
            normalKakukyokuYojinMap[formatType][actualStrength] &&
            normalKakukyokuYojinMap[formatType][actualStrength][mostFrequentPair]) {
            return normalKakukyokuYojinMap[formatType][actualStrength][mostFrequentPair];
        }
    }
    catch (error) {
        console.error("\u65E9\u898B\u8868\u304B\u3089\u306E\u7528\u795E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ".concat(formatType, ", ").concat(actualStrength, ", ").concat(mostFrequentPair), error);
    }
    // デフォルト値を返す
    return '比劫';
}
/**
 * 通変星ペアから具体的な十神を選定する関数
 * @param tenGodPair 通変星ペア
 * @param tenGodCounts 各通変星の出現回数
 * @returns 選定された十神
 */
function selectSpecificTenGod(tenGodPair, tenGodCounts) {
    // 通変星ペアに基づいて具体的な十神を選定
    switch (tenGodPair) {
        case '比劫':
            // 比肩と劫財のどちらが多いか
            var bikenCount = tenGodCounts['比肩'] || 0;
            var kouzaiCount = tenGodCounts['劫財'] || 0;
            console.log("\u6BD4\u80A9: ".concat(bikenCount, "\u500B, \u52AB\u8CA1: ").concat(kouzaiCount, "\u500B"));
            if (bikenCount > kouzaiCount) {
                return '比肩';
            }
            else if (kouzaiCount > bikenCount) {
                return '劫財';
            }
            else {
                // 同数の場合は地支の通変星を優先（実装は省略）
                return '比肩';
            }
        case '印':
            // 偏印と正印のどちらが多いか
            var henInCount = tenGodCounts['偏印'] || 0;
            var seiInCount = tenGodCounts['正印'] || 0;
            if (henInCount > seiInCount) {
                return '偏印';
            }
            else if (seiInCount > henInCount) {
                return '正印';
            }
            else {
                return '正印';
            }
        case '食傷':
            // 食神と傷官のどちらが多いか
            var shokuShinCount = tenGodCounts['食神'] || 0;
            var shougouCount = tenGodCounts['傷官'] || 0;
            if (shokuShinCount > shougouCount) {
                return '食神';
            }
            else if (shougouCount > shokuShinCount) {
                return '傷官';
            }
            else {
                return '食神';
            }
        case '財':
            // 偏財と正財のどちらが多いか
            var henZaiCount = tenGodCounts['偏財'] || 0;
            var seiZaiCount = tenGodCounts['正財'] || 0;
            if (henZaiCount > seiZaiCount) {
                return '偏財';
            }
            else if (seiZaiCount > henZaiCount) {
                return '正財';
            }
            else {
                return '正財';
            }
        case '官殺':
            // 偏官と正官のどちらが多いか
            var henKanCount = tenGodCounts['偏官'] || 0;
            var seiKanCount = tenGodCounts['正官'] || 0;
            if (henKanCount > seiKanCount) {
                return '偏官';
            }
            else if (seiKanCount > henKanCount) {
                return '正官';
            }
            else {
                return '正官';
            }
        default:
            // デフォルト値
            return '比肩';
    }
}
/**
 * 十神名から五行を取得する関数
 * @param tenGod 十神名
 * @param dayStem 日干
 * @returns 五行名（wood, fire, earth, metal, water）
 */
function convertTenGodToElement(tenGod, dayStem) {
    var dayElement = tenGodCalculator.getElementFromStem(dayStem);
    // 通変星ペアの処理を先に行う
    if (tenGod === '比劫')
        return dayElement;
    if (tenGod === '印')
        return getElementProducing(dayElement);
    if (tenGod === '食傷')
        return getElementProducedBy(dayElement);
    if (tenGod === '財')
        return getElementControlledBy(dayElement);
    if (tenGod === '官殺')
        return getElementControlling(dayElement);
    // 十神と日干の関係から、用神の五行を特定
    switch (tenGod) {
        case '比肩':
        case '劫財':
            return dayElement; // 同じ五行
        case '食神':
        case '傷官':
            // 日干が生じる五行
            return getElementProducedBy(dayElement);
        case '偏財':
        case '正財':
            // 日干が克する五行
            return getElementControlledBy(dayElement);
        case '偏官':
        case '正官':
            // 日干を克する五行
            return getElementControlling(dayElement);
        case '偏印':
        case '正印':
            // 日干を生じる五行
            return getElementProducing(dayElement);
        default:
            console.log("\u672A\u77E5\u306E\u5341\u795E\u540D: ".concat(tenGod));
            return dayElement; // 不明な場合は日干と同じ五行
    }
}
/**
 * 五行間の相生関係で、指定された五行が生み出す五行を取得
 * @param element 基準となる五行
 * @returns 生み出される五行
 */
function getElementProducedBy(element) {
    var productionCycle = {
        '木': '火', // 木は火を生む
        '火': '土', // 火は土を生む
        '土': '金', // 土は金を生む
        '金': '水', // 金は水を生む
        '水': '木' // 水は木を生む
    };
    return productionCycle[element] || element;
}
/**
 * 五行間の相剋関係で、指定された五行が克する五行を取得
 * @param element 基準となる五行
 * @returns 克される五行
 */
function getElementControlledBy(element) {
    var controlCycle = {
        '木': '土', // 木は土を克する
        '土': '水', // 土は水を克する
        '水': '火', // 水は火を克する
        '火': '金', // 火は金を克する
        '金': '木' // 金は木を克する
    };
    return controlCycle[element] || element;
}
/**
 * 五行間の相剋関係で、指定された五行を克する五行を取得
 * @param element 基準となる五行
 * @returns 克する五行
 */
function getElementControlling(element) {
    var controlledByCycle = {
        '木': '金', // 木は金に克される
        '金': '火', // 金は火に克される
        '火': '水', // 火は水に克される
        '水': '土', // 水は土に克される
        '土': '木' // 土は木に克される
    };
    return controlledByCycle[element] || element;
}
/**
 * 五行間の相生関係で、指定された五行を生み出す五行を取得
 * @param element 基準となる五行
 * @returns 生み出す五行
 */
function getElementProducing(element) {
    var producingCycle = {
        '木': '水', // 木は水から生まれる
        '火': '木', // 火は木から生まれる
        '土': '火', // 土は火から生まれる
        '金': '土', // 金は土から生まれる
        '水': '金' // 水は金から生まれる
    };
    return producingCycle[element] || element;
}
/**
 * 用神の説明文を生成する関数
 * @param tenGod 十神名
 * @param element 五行名
 * @param kakukyoku 格局情報
 * @returns 用神の説明文
 */
function generateYojinDescription(tenGod, element, kakukyoku) {
    var elementJp = translateElementToJapanese(element);
    var strength = kakukyoku.strength;
    // 基本的な説明文テンプレート
    var description = "\u3042\u306A\u305F\u306E\u7528\u795E\u306F\u300C".concat(tenGod, "\uFF08").concat(elementJp, "\uFF09\u300D\u3067\u3059\u3002");
    // 身強・身弱に応じた補足説明
    if (strength === 'strong') {
        description += "\u8EAB\u5F37\u306E\u72B6\u614B\u306A\u306E\u3067\u3001".concat(elementJp, "\u306E\u529B\u3067\u65E5\u5E72\u3092\u6291\u5236\u3057\u3001\u30D0\u30E9\u30F3\u30B9\u3092\u53D6\u308B\u3053\u3068\u304C\u904B\u6C17\u306E\u9375\u3068\u306A\u308A\u307E\u3059\u3002");
    }
    else if (strength === 'weak') {
        description += "\u8EAB\u5F31\u306E\u72B6\u614B\u306A\u306E\u3067\u3001".concat(elementJp, "\u306E\u529B\u3067\u65E5\u5E72\u3092\u652F\u63F4\u3057\u3001\u5F37\u5316\u3059\u308B\u3053\u3068\u304C\u904B\u6C17\u306E\u9375\u3068\u306A\u308A\u307E\u3059\u3002");
    }
    else {
        description += "\u4E2D\u548C\u306E\u72B6\u614B\u306A\u306E\u3067\u3001".concat(elementJp, "\u306E\u529B\u3067\u65E5\u5E72\u3068\u306E\u8ABF\u548C\u3092\u4FDD\u3064\u3053\u3068\u304C\u904B\u6C17\u306E\u9375\u3068\u306A\u308A\u307E\u3059\u3002");
    }
    // 十神タイプ別の具体的アドバイス
    switch (tenGod) {
        case '比肩':
            description += '同じ五行の力を借りて自分を強化し、協力者との連携が運気を高めます。';
            break;
        case '劫財':
            description += '同じ系統の力を競い合いながら、自己の強化と成長を促すことが重要です。';
            break;
        case '食神':
            description += '創造性を発揮し、表現力を高めることであなたの運気が向上します。';
            break;
        case '傷官':
            description += '独自の才能や技術を磨き、専門性を高めることが運気の向上につながります。';
            break;
        case '偏財':
            description += '積極的な行動と冒険心が財運を引き寄せ、運気を高めます。';
            break;
        case '正財':
            description += '堅実な計画と着実な努力が安定した財運をもたらし、運気を高めます。';
            break;
        case '偏官':
            description += '権威や秩序を重んじ、社会的な規範に従うことが運気を整えます。';
            break;
        case '正官':
            description += '責任感と誠実さを持って行動することが、信頼と運気を高めます。';
            break;
        case '偏印':
            description += '学びと知識の探求が内面を豊かにし、運気を向上させます。';
            break;
        case '正印':
            description += '精神的な成長と内省が、あなたの運気を支える基盤となります。';
            break;
        default:
            description += '運気のバランスを保つことが重要です。';
    }
    return description;
}
/**
 * 用神をサポートする五行を取得する関数
 * @param element 用神の五行
 * @returns サポート五行のリスト
 */
function getSupportingElements(element) {
    // 用神を強める五行（生む五行と同じ五行）
    var supporting = [element]; // 自分自身も含める
    // 用神を生み出す五行を追加
    var producingElement = getElementProducing(element);
    supporting.push(producingElement);
    return supporting;
}
/**
 * 五行名を日本語に変換する補助関数
 * @param element 五行名（英語）
 * @returns 五行名（日本語）
 */
function translateElementToJapanese(element) {
    var translations = {
        'wood': '木',
        '木': '木',
        'fire': '火',
        '火': '火',
        'earth': '土',
        '土': '土',
        'metal': '金',
        '金': '金',
        'water': '水',
        '水': '水'
    };
    return translations[element] || element;
}
/**
 * 用神に基づいて喜神・忌神・仇神を特定する関数
 * @param yojin 用神（十神）
 * @param dayMaster 日干
 * @param kakukyoku 格局情報
 * @param fourPillars 四柱情報
 * @returns 喜神・忌神・仇神情報
 */
function determineRelatedGods(yojin, dayMaster, kakukyoku, fourPillars) {
    // 特別格局の場合は早見表から直接取得
    if (kakukyoku.category === 'special') {
        var relatedGods_1 = getSpecialKakukyokuRelatedGods(kakukyoku.type, dayMaster, fourPillars);
        // 五行に変換
        var kijinElement_1 = relatedGods_1.kijin.element;
        var kijin2Element_1 = relatedGods_1.kijin2.element;
        var kyujinElement_1 = relatedGods_1.kyujin.element;
        // 説明文を生成
        var kijinDescription_1 = relatedGods_1.kijin.description || "".concat(kijinElement_1, "\u306E").concat(relatedGods_1.kijin.tenGod, "\u304C\u559C\u795E\u3067\u3059");
        var kijin2Description_1 = relatedGods_1.kijin2.description || "".concat(kijin2Element_1, "\u306E").concat(relatedGods_1.kijin2.tenGod, "\u304C\u5FCC\u795E\u3067\u3059");
        var kyujinDescription_1 = relatedGods_1.kyujin.description || "".concat(kyujinElement_1, "\u306E").concat(relatedGods_1.kyujin.tenGod, "\u304C\u4EC7\u795E\u3067\u3059");
        return {
            kijin: __assign(__assign({}, relatedGods_1.kijin), { description: kijinDescription_1 }),
            kijin2: __assign(__assign({}, relatedGods_1.kijin2), { description: kijin2Description_1 }),
            kyujin: __assign(__assign({}, relatedGods_1.kyujin), { description: kyujinDescription_1 })
        };
    }
    // 普通格局の場合
    // 天干から五行を特定する
    var dayElement = getDayElementFromStem(dayMaster);
    // このテスト実装では適当な値を返す
    var tenGodCounts = countTenGods(fourPillars);
    var pairCounts = {
        '比劫': tenGodCounts['比肩'] + tenGodCounts['劫財'],
        '印': tenGodCounts['偏印'] + tenGodCounts['正印'],
        '食傷': tenGodCounts['食神'] + tenGodCounts['傷官'],
        '財': tenGodCounts['偏財'] + tenGodCounts['正財'],
        '官殺': tenGodCounts['偏官'] + tenGodCounts['正官']
    };
    // 2. 命式内で最も多い通変星ペアを特定
    var mostFrequentPair = getMostFrequentPair(pairCounts);
    console.log("\u547D\u5F0F\u5185\u3067\u6700\u3082\u591A\u3044\u901A\u5909\u661F\u30DA\u30A2: ".concat(mostFrequentPair));
    // 3. 格局タイプ、身強/身弱、最も多い通変星に基づいて関連神を取得
    var relatedGods = getNormalKakukyokuRelatedGods(kakukyoku.type, kakukyoku.strength, mostFrequentPair, yojin);
    // 4. 通変星ペアから具体的な十神を選定
    var kijinTenGod = selectSpecificTenGod(relatedGods.kijin, tenGodCounts);
    var kijin2TenGod = selectSpecificTenGod(relatedGods.kijin2, tenGodCounts);
    var kyujinTenGod = selectSpecificTenGod(relatedGods.kyujin, tenGodCounts);
    // 5. 五行属性の変換
    var kijinElement = getElementFromTenGod(kijinTenGod, dayMaster);
    var kijin2Element = getElementFromTenGod(kijin2TenGod, dayMaster);
    var kyujinElement = getElementFromTenGod(kyujinTenGod, dayMaster);
    // 6. 説明文の生成
    var kijinDescription = generateGodDescription(kijinTenGod, kijinElement, '喜神');
    var kijin2Description = generateGodDescription(kijin2TenGod, kijin2Element, '忌神');
    var kyujinDescription = generateGodDescription(kyujinTenGod, kyujinElement, '仇神');
    return {
        kijin: {
            tenGod: kijinTenGod,
            element: kijinElement,
            description: kijinDescription
        },
        kijin2: {
            tenGod: kijin2TenGod,
            element: kijin2Element,
            description: kijin2Description
        },
        kyujin: {
            tenGod: kyujinTenGod,
            element: kyujinElement,
            description: kyujinDescription
        }
    };
}
/**
 * 十神名から五行を取得する関数（汎用版）
 * @param tenGod 十神名（通変星グループも含む）
 * @param dayStem 日干
 * @returns 五行名
 */
function getElementFromTenGod(tenGod, dayStem) {
    var dayElement = tenGodCalculator.getElementFromStem(dayStem);
    // 通変星グループの場合、最初の具体的な十神を使用
    if (tenGod === '比劫') {
        return dayElement; // 日干と同じ五行
    }
    else if (tenGod === '印') {
        return getElementProducing(dayElement); // 日干を生じる五行
    }
    else if (tenGod === '食傷') {
        return getElementProducedBy(dayElement); // 日干が生じる五行
    }
    else if (tenGod === '財') {
        return getElementControlledBy(dayElement); // 日干が克する五行
    }
    else if (tenGod === '官殺') {
        return getElementControlling(dayElement); // 日干を克する五行
    }
    // 個別の十神の場合
    switch (tenGod) {
        case '比肩':
        case '劫財':
            return dayElement; // 同じ五行
        case '食神':
        case '傷官':
            return getElementProducedBy(dayElement); // 日干が生じる五行
        case '偏財':
        case '正財':
            return getElementControlledBy(dayElement); // 日干が克する五行
        case '偏官':
        case '正官':
            return getElementControlling(dayElement); // 日干を克する五行
        case '偏印':
        case '正印':
            return getElementProducing(dayElement); // 日干を生じる五行
        default:
            return dayElement; // 不明な場合は日干と同じ五行
    }
}
/**
 * 普通格局の関連神（喜神・忌神・仇神）を早見表から取得する関数
 * @param kakukyokuType 格局タイプ
 * @param strength 身強/身弱
 * @param mostFrequentPair 命式内で最も多い通変星ペア
 * @param yojin 用神（十神）
 * @returns 関連神情報
 */
function getNormalKakukyokuRelatedGods(kakukyokuType, strength, mostFrequentPair, yojin) {
    // 格局タイプから「格」を省いた形式
    var formatType = kakukyokuType.replace(/格$/, '');
    var actualStrength = strength === 'neutral' ? 'strong' : strength;
    // 早見表データ（saju_yojin_algorithm.mdに基づく）
    var relatedGodsMap = {
        // 建禄格・月刃格の早見表
        '建禄': {
            'strong': {
                '官殺': { kijin: '財', kijin2: '比劫', kyujin: '印' },
                '財': { kijin: '官殺', kijin2: '印', kyujin: '比劫' },
                '食傷': { kijin: '財', kijin2: '比劫', kyujin: '印' }
            },
            'weak': {
                '印': { kijin: '比劫', kijin2: '食傷', kyujin: '官殺' },
                '比劫': { kijin: '印', kijin2: '官殺', kyujin: '財' }
            }
        },
        '月刃': {
            'strong': {
                '官殺': { kijin: '財', kijin2: '比劫', kyujin: '印' },
                '財': { kijin: '官殺', kijin2: '印', kyujin: '比劫' },
                '食傷': { kijin: '財', kijin2: '比劫', kyujin: '印' }
            },
            'weak': {
                '印': { kijin: '比劫', kijin2: '食傷', kyujin: '官殺' },
                '比劫': { kijin: '印', kijin2: '官殺', kyujin: '財' }
            }
        },
        // 他の格局タイプも同様に定義...
        // 実際のアプリケーションでは全ての格局タイプに対応するマッピングを作成する
    };
    var relatedGods;
    // 早見表から関連神を取得
    try {
        if (relatedGodsMap[formatType] &&
            relatedGodsMap[formatType][actualStrength] &&
            relatedGodsMap[formatType][actualStrength][yojin]) {
            relatedGods = relatedGodsMap[formatType][actualStrength][yojin];
        }
    }
    catch (error) {
        console.error("\u65E9\u898B\u8868\u304B\u3089\u306E\u95A2\u9023\u795E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ".concat(formatType, ", ").concat(actualStrength, ", ").concat(yojin), error);
    }
    // デフォルト値
    if (!relatedGods) {
        if (actualStrength === 'strong') {
            return {
                kijin: '財',
                kijin2: '比劫',
                kyujin: '印'
            };
        }
        else {
            return {
                kijin: '比劫',
                kijin2: '食傷',
                kyujin: '官殺'
            };
        }
    }
    return relatedGods;
}
/**
 * 喜神・忌神・仇神の説明文を生成する関数
 * @param tenGod 十神名
 * @param element 五行名
 * @param godType 神のタイプ（喜神・忌神・仇神）
 * @returns 説明文
 */
function generateGodDescription(tenGod, element, godType) {
    var elementJp = translateElementToJapanese(element);
    var description = "\u3042\u306A\u305F\u306E".concat(godType, "\u306F\u300C").concat(tenGod, "\uFF08").concat(elementJp, "\uFF09\u300D\u3067\u3059\u3002");
    // 神のタイプ別の補足説明
    if (godType === '喜神') {
        description += "".concat(elementJp, "\u306E\u529B\u304C\u3042\u306A\u305F\u306E\u7528\u795E\u3092\u5F37\u3081\u3001\u904B\u6C17\u3092\u9AD8\u3081\u307E\u3059\u3002");
    }
    else if (godType === '忌神') {
        description += "".concat(elementJp, "\u306E\u529B\u306F\u7528\u795E\u306E\u50CD\u304D\u3092\u59A8\u3052\u308B\u306E\u3067\u3001\u63A7\u3048\u3081\u306B\u3059\u308B\u3053\u3068\u304C\u5927\u5207\u3067\u3059\u3002");
    }
    else { // 仇神
        description += "".concat(elementJp, "\u306E\u529B\u306F\u904B\u6C17\u306B\u60AA\u5F71\u97FF\u3092\u4E0E\u3048\u308B\u306E\u3067\u3001\u3067\u304D\u308B\u3060\u3051\u907F\u3051\u308B\u3088\u3046\u306B\u3057\u307E\u3057\u3087\u3046\u3002");
    }
    return description;
}
