"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.ValidationError = exports.AuthorizationError = exports.AuthenticationError = exports.AppError = void 0;
// アプリケーション共通のエラークラス
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.isOperational = true; // 操作的なエラー（予期されたエラー）
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
// 認証エラー
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    function AuthenticationError(message) {
        if (message === void 0) { message = '認証に失敗しました'; }
        return _super.call(this, message, 401) || this;
    }
    return AuthenticationError;
}(AppError));
exports.AuthenticationError = AuthenticationError;
// 権限エラー
var AuthorizationError = /** @class */ (function (_super) {
    __extends(AuthorizationError, _super);
    function AuthorizationError(message) {
        if (message === void 0) { message = '権限がありません'; }
        return _super.call(this, message, 403) || this;
    }
    return AuthorizationError;
}(AppError));
exports.AuthorizationError = AuthorizationError;
// 入力検証エラー
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message) {
        if (message === void 0) { message = '入力が無効です'; }
        return _super.call(this, message, 400) || this;
    }
    return ValidationError;
}(AppError));
exports.ValidationError = ValidationError;
// リソース未検出エラー
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        if (message === void 0) { message = 'リソースが見つかりません'; }
        return _super.call(this, message, 404) || this;
    }
    return NotFoundError;
}(AppError));
exports.NotFoundError = NotFoundError;
// リクエスト不正エラー
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message) {
        if (message === void 0) { message = 'リクエストが無効です'; }
        return _super.call(this, message, 400) || this;
    }
    return BadRequestError;
}(AppError));
exports.BadRequestError = BadRequestError;
// 認可エラー
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message) {
        if (message === void 0) { message = '権限がありません'; }
        return _super.call(this, message, 403) || this;
    }
    return UnauthorizedError;
}(AppError));
exports.UnauthorizedError = UnauthorizedError;
// エラーハンドリング関数
var handleError = function (err, res) {
    // AppErrorの場合は操作的エラーとして処理
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }
    // 予期しないエラーの場合
    console.error('予期しないエラー:', err);
    return res.status(500).json({
        status: 'error',
        message: '内部サーバーエラーが発生しました'
    });
};
exports.handleError = handleError;
