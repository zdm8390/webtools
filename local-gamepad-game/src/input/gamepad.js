/**
 * GamepadManager - Windows Web Gamepad API 管理クラス
 * コントローラーの自動認識、スティックのデッドゾーン補正、各種ボタン入力の追跡、振動（Haptics）を提供。
 */
export class GamepadManager {
    constructor() {
        this.gamepadIndex = null;
        this.connected = false;
        this.deadzone = 0.18; // スティックの不感帯

        // ボタン状態テーブル
        this.buttons = {
            punch: { pressed: false, justPressed: false, prev: false },      // X / West
            kick: { pressed: false, justPressed: false, prev: false },       // Y / North
            guard: { pressed: false, justPressed: false, prev: false },      // B / East
            dash: { pressed: false, justPressed: false, prev: false },       // A / South
            lockon: { pressed: false, justPressed: false, prev: false },     // LB / L1
            pause: { pressed: false, justPressed: false, prev: false }       // Start / Menu
        };

        // キーボードフォールバック用
        this.keyState = {};
        
        // スティック入力値 (-1.0 ~ 1.0)
        this.leftStick = { x: 0, y: 0 };
        this.rightStick = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        window.addEventListener("gamepadconnected", (e) => {
            console.log(`🎮 Controller Connected: ${e.gamepad.id} (Index: ${e.gamepad.index})`);
            this.gamepadIndex = e.gamepad.index;
            this.connected = true;
            this.vibrate(200, 0.5, 0.5); // 接続通知振動
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                console.log("🎮 Controller Disconnected");
                this.gamepadIndex = null;
                this.connected = false;
            }
        });

        // キーボードフォールバック
        window.addEventListener("keydown", (e) => {
            this.keyState[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keyState[e.code] = false;
        });
    }

    update() {
        // 全ボタンの justPressed を初期化
        for (const key in this.buttons) {
            this.buttons[key].justPressed = false;
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let pad = null;

        if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
            pad = gamepads[this.gamepadIndex];
        } else {
            // 最初に見つかった接続中パッドを自動バインド
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    pad = gamepads[i];
                    this.gamepadIndex = i;
                    this.connected = true;
                    break;
                }
            }
        }

        if (pad) {
            // スティック計算 (Deadzone適用)
            this.leftStick.x = this.applyDeadzone(pad.axes[0] || 0);
            this.leftStick.y = this.applyDeadzone(pad.axes[1] || 0);
            this.rightStick.x = this.applyDeadzone(pad.axes[2] || 0);
            this.rightStick.y = this.applyDeadzone(pad.axes[3] || 0);

            // 標準ゲームパッドボタンマッピング
            // 0: A (South), 1: B (East), 2: X (West), 3: Y (North), 4: LB, 9: Start
            this.updateButton('dash', pad.buttons[0]?.pressed);
            this.updateButton('guard', pad.buttons[1]?.pressed);
            this.updateButton('punch', pad.buttons[2]?.pressed);
            this.updateButton('kick', pad.buttons[3]?.pressed);
            this.updateButton('lockon', pad.buttons[4]?.pressed || pad.buttons[5]?.pressed);
            this.updateButton('pause', pad.buttons[9]?.pressed);
        } else {
            // キーボードフォールバック処理
            this.leftStick.x = (this.keyState["KeyD"] ? 1 : 0) - (this.keyState["KeyA"] ? 1 : 0);
            this.leftStick.y = (this.keyState["KeyS"] ? 1 : 0) - (this.keyState["KeyW"] ? 1 : 0);

            this.rightStick.x = (this.keyState["ArrowRight"] ? 1 : 0) - (this.keyState["ArrowLeft"] ? 1 : 0);
            this.rightStick.y = (this.keyState["ArrowDown"] ? 1 : 0) - (this.keyState["ArrowUp"] ? 1 : 0);

            this.updateButton('punch', !!this.keyState["KeyJ"] || !!this.keyState["Numpad1"]);
            this.updateButton('kick', !!this.keyState["KeyK"] || !!this.keyState["Numpad2"]);
            this.updateButton('guard', !!this.keyState["KeyL"] || !!this.keyState["Numpad3"]);
            this.updateButton('dash', !!this.keyState["Space"]);
            this.updateButton('lockon', !!this.keyState["ShiftLeft"]);
            this.updateButton('pause', !!this.keyState["Escape"]);
        }
    }

    applyDeadzone(value) {
        if (Math.abs(value) < this.deadzone) return 0;
        const sign = Math.sign(value);
        return sign * ((Math.abs(value) - this.deadzone) / (1 - this.deadzone));
    }

    updateButton(name, isPressed) {
        const btn = this.buttons[name];
        btn.pressed = !!isPressed;
        btn.justPressed = btn.pressed && !btn.prev;
        btn.prev = btn.pressed;
    }

    /**
     * コントローラー振動 (DualShock/Haptics) を実行
     * @param {number} duration 振動時間 (ms)
     * @param {number} strongMagnitude 低周波（重い衝撃）
     * @param {number} weakMagnitude 高周波（軽い振動）
     */
    vibrate(duration = 150, strongMagnitude = 0.6, weakMagnitude = 0.4) {
        if (!this.connected || this.gamepadIndex === null) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const pad = gamepads[this.gamepadIndex];
        
        if (pad && pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === "function") {
            pad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weakMagnitude,
                strongMagnitude: strongMagnitude
            }).catch(() => {});
        }
    }
}
