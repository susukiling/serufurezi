/**
 * gas-api.js
 * Google Apps Script（ウェブアプリとしてデプロイ）を
 * バックエンドAPIとして呼び出すための共通クライアントです。
 * index.html / checkout.html の両方から読み込まれます。
 *
 * ▼ 使い方
 * 1. Google Apps Script プロジェクトを「デプロイ」→「新しいデプロイ」
 *    →種類「ウェブアプリ」で公開してください。
 *      - 実行するユーザー: 自分
 *      - アクセスできるユーザー: 全員
 * 2. 発行された「ウェブアプリURL」（末尾が /exec のもの）を
 *    下の API_BASE_URL に貼り付けてください。
 */

const API_BASE_URL = "ここにGASのウェブアプリURL（/exec で終わるもの）を貼り付けてください";

function ensureApiConfigured_() {
    if (!API_BASE_URL || API_BASE_URL.indexOf('ここに') === 0 || API_BASE_URL.indexOf('/exec') === -1) {
        throw new Error('API_BASE_URL が未設定です。gas-api.js を編集してGASのウェブアプリURLを設定してください。');
    }
}

/**
 * GET リクエスト（データ取得用）
 * クエリパラメータのみのシンプルなリクエストなので、CORSプリフライトは発生しません。
 */
async function gasGet_(action, params = {}) {
    ensureApiConfigured_();
    const url = new URL(API_BASE_URL);
    url.searchParams.set('action', action);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));

    let res;
    try {
        res = await fetch(url.toString(), { method: 'GET' });
    } catch (e) {
        throw new Error('サーバーに接続できませんでした。GASのデプロイ設定（アクセス権: 全員）とURLを確認してください。');
    }
    if (!res.ok) throw new Error(`サーバーエラー (HTTP ${res.status})`);
    return res.json();
}

/**
 * POST リクエスト（保存・削除など）
 * Content-Type を text/plain にすることで、GASが対応していない
 * CORSプリフライト(OPTIONSメソッド)を回避しています。
 */
async function gasPost_(action, payload = {}) {
    ensureApiConfigured_();
    let res;
    try {
        res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });
    } catch (e) {
        throw new Error('サーバーに接続できませんでした。GASのデプロイ設定（アクセス権: 全員）とURLを確認してください。');
    }
    if (!res.ok) throw new Error(`サーバーエラー (HTTP ${res.status})`);
    return res.json();
}

/** アイテム一覧を取得します（成功時は配列、失敗時は例外を投げます） */
async function apiGetItems() {
    const json = await gasGet_('getItems');
    if (!json.success) throw new Error(json.error || 'データの取得に失敗しました');
    return json.data || [];
}

/** アイテムを保存（新規 or 更新）します */
async function apiSaveItem(data) {
    return gasPost_('saveItem', { data });
}

/** コードを指定してアイテムを削除します */
async function apiDeleteItem(code) {
    return gasPost_('deleteItem', { code });
}
