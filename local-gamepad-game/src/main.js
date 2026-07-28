import * as THREE from 'three';
import { GamepadManager } from './input/gamepad.js';
import { ThirdPersonCamera } from './camera/thirdPersonCamera.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { CityStage } from './stage/cityStage.js';
import { AudioManager } from './sound/audioManager.js';

class GameApp {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Three.js 初期設定
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e17);
        this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.025);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 各種マネージャー・エンティティ
        this.gamepadManager = new GamepadManager();
        this.audioManager = new AudioManager();

        this.stage = new CityStage(this.scene);
        this.player = new Player(this.scene);
        this.thirdPersonCamera = new ThirdPersonCamera(this.camera, this.player.meshGroup);

        // 敵キャラクター（複数配置）
        this.enemies = [
            new Enemy(this.scene, new THREE.Vector3(0, 0, -10)),
            new Enemy(this.scene, new THREE.Vector3(-6, 0, -16)),
            new Enemy(this.scene, new THREE.Vector3(8, 0, 10))
        ];

        this.comboCount = 0;
        this.comboResetTimer = 0;

        // UIエレメント参照
        this.uiPlayerHp = document.getElementById('player-hp-bar');
        this.uiControllerStatus = document.getElementById('controller-status');
        this.uiComboCounter = document.getElementById('combo-counter');
        this.uiComboNumber = document.getElementById('combo-number');

        this.clock = new THREE.Clock();
        window.addEventListener('resize', () => this.onWindowResize());

        // アニメーションループ開始
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.05);

        // 1. 入力更新
        this.gamepadManager.update();

        // 2. プレイヤー更新
        this.player.update(this.gamepadManager, this.thirdPersonCamera, deltaTime, this.audioManager, this.gamepadManager);

        // 3. カメラ追従更新
        this.thirdPersonCamera.update(this.gamepadManager.rightStick, deltaTime);

        // 4. ステージ & 破片更新
        this.stage.update(deltaTime);

        // 5. 敵AI更新
        for (const enemy of this.enemies) {
            enemy.update(this.player, deltaTime, this.audioManager, this.gamepadManager);
        }

        // 6. 当たり判定（プレイヤーの攻撃 ➔ 敵 & 破壊可能オブジェクト）
        this.checkCombatCollisions();

        // 7. UIログ更新
        this.updateUI(deltaTime);

        // 8. 3Dレンダリング
        this.renderer.render(this.scene, this.camera);
    }

    checkCombatCollisions() {
        const attackSphere = this.player.getAttackSphere();
        if (attackSphere && !this.player.hasHit) {
            // 前方ベクトル
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);

            // A. 破壊可能オブジェクトへの攻撃ヒット判定
            for (const obj of this.stage.destructibles) {
                if (obj.destroyed) continue;
                const objSphere = obj.getBoundingSphere();
                if (attackSphere.intersectsSphere(objSphere)) {
                    const dmg = this.player.attackType === 'kick' ? 2 : 1;
                    const destroyed = obj.takeDamage(dmg, attackSphere.center, forward);
                    this.player.hasHit = true;
                    this.registerCombo();

                    if (destroyed) {
                        this.audioManager.playDestruction();
                        this.gamepadManager.vibrate(220, 0.9, 0.5);
                    }
                    break;
                }
            }

            // B. 敵キャラクターへの攻撃ヒット判定
            for (const enemy of this.enemies) {
                if (enemy.hp <= 0) continue;
                const enemySphere = enemy.getBoundingSphere();
                if (attackSphere.intersectsSphere(enemySphere)) {
                    const dmg = this.player.attackType === 'kick' ? 24 : 15;
                    enemy.takeDamage(dmg, forward, this.audioManager, this.gamepadManager);
                    this.player.hasHit = true;
                    this.registerCombo();
                    break;
                }
            }
        }
    }

    registerCombo() {
        this.comboCount++;
        this.comboResetTimer = 2.0;
        if (this.uiComboCounter) {
            this.uiComboCounter.style.display = 'block';
            this.uiComboNumber.innerText = this.comboCount;
        }
    }

    updateUI(deltaTime) {
        // コントローラー接続状態の同期
        if (this.uiControllerStatus) {
            if (this.gamepadManager.connected) {
                this.uiControllerStatus.className = 'status-badge connected';
                this.uiControllerStatus.innerText = '🎮 コントローラー接続完了 (Active)';
            } else {
                this.uiControllerStatus.className = 'status-badge disconnected';
                this.uiControllerStatus.innerText = '⌨️ コントローラー未検知 (WASD/J/K/L 操作可能)';
            }
        }

        // プレイヤーHPバー
        if (this.uiPlayerHp) {
            const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
            this.uiPlayerHp.style.width = `${hpPercent}%`;
        }

        // コンボタイマーの減少
        if (this.comboCount > 0) {
            this.comboResetTimer -= deltaTime;
            if (this.comboResetTimer <= 0) {
                this.comboCount = 0;
                if (this.uiComboCounter) this.uiComboCounter.style.display = 'none';
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// ドキュメントロード完了後に起動
window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
