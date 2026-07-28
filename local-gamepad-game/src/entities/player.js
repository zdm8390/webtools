import * as THREE from 'three';

/**
 * Player - プレイヤーキャラクター（三人称3D格闘アクション）
 */
export class Player {
    constructor(scene) {
        this.scene = scene;
        this.meshGroup = new THREE.Group();
        this.scene.add(this.meshGroup);

        this.position = this.meshGroup.position;
        this.rotation = this.meshGroup.rotation;

        this.hp = 100;
        this.maxHp = 100;
        this.guardHp = 100;

        this.moveSpeed = 8.5;
        this.state = 'idle'; // 'idle', 'moving', 'punching', 'kicking', 'guarding', 'dashing', 'hit'
        this.stateTimer = 0;

        this.attackHitbox = null;
        this.attackType = null; // 'punch', 'kick'
        this.hasHit = false;

        this.buildMesh();
    }

    buildMesh() {
        // ボディ（胴体）
        const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.7 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 1.2;
        this.bodyMesh.castShadow = true;
        this.meshGroup.add(this.bodyMesh);

        // ヘッド（頭）
        const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9 });
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.set(0, 2.05, 0);
        this.headMesh.castShadow = true;
        this.meshGroup.add(this.headMesh);

        // バイザー（目元発光）
        const visorGeo = new THREE.BoxGeometry(0.42, 0.12, 0.22);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 2.08, 0.2);
        this.meshGroup.add(visor);

        // 腕（右腕・左腕）
        const armGeo = new THREE.BoxGeometry(0.28, 0.8, 0.28);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.8 });

        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(-0.58, 1.3, 0);
        this.meshGroup.add(this.rightArm);

        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(0.58, 1.3, 0);
        this.meshGroup.add(this.leftArm);

        // 拳（ナックル発光部）
        const fistGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const fistMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
        this.rightFist = new THREE.Mesh(fistGeo, fistMat);
        this.rightFist.position.set(0, -0.45, 0.1);
        this.rightArm.add(this.rightFist);

        // 脚（右脚・左脚）
        const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.32);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.5 });

        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(-0.25, 0.45, 0);
        this.meshGroup.add(this.rightLeg);

        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(0.25, 0.45, 0);
        this.meshGroup.add(this.leftLeg);
    }

    update(input, camera, deltaTime, audioManager, gamepadManager) {
        this.stateTimer -= deltaTime;

        // ステート更新・アクション実行
        if (this.state === 'punching' || this.state === 'kicking') {
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.resetPose();
            } else {
                this.animateAttack(deltaTime);
            }
            return;
        }

        if (this.state === 'dashing') {
            if (this.stateTimer <= 0) {
                this.state = 'idle';
            } else {
                this.meshGroup.translateZ(18 * deltaTime);
            }
            return;
        }

        if (this.state === 'hit') {
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.resetPose();
            }
            return;
        }

        // --- 入力判定 ---
        // パンチ (X Button / West)
        if (input.buttons.punch.justPressed) {
            this.startAttack('punch', audioManager, gamepadManager);
            return;
        }

        // キック (Y Button / North)
        if (input.buttons.kick.justPressed) {
            this.startAttack('kick', audioManager, gamepadManager);
            return;
        }

        // ガード (B Button / East)
        if (input.buttons.guard.pressed) {
            this.state = 'guarding';
            this.poseGuard();
            return;
        } else if (this.state === 'guarding') {
            this.state = 'idle';
            this.resetPose();
        }

        // ダッシュ (A Button / South)
        if (input.buttons.dash.justPressed) {
            this.state = 'dashing';
            this.stateTimer = 0.18;
            gamepadManager.vibrate(80, 0.3, 0.2);
            return;
        }

        // --- 3D移動処理 ---
        const stick = input.leftStick;
        if (Math.abs(stick.x) > 0.05 || Math.abs(stick.y) > 0.05) {
            this.state = 'moving';

            // カメラの向きに基づく相対移動ベクトル
            const forward = camera.getForwardVector();
            const right = camera.getRightVector();

            const moveDir = new THREE.Vector3()
                .addScaledVector(right, stick.x)
                .addScaledVector(forward, -stick.y)
                .normalize();

            // プレイヤーを移動方向へスムーズ回転
            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetAngle - this.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotation.y += diff * 0.25;

            // 物理移動
            this.position.addScaledVector(moveDir, this.moveSpeed * deltaTime);

            // 歩行アニメーション
            const walkTime = Date.now() * 0.012;
            this.rightLeg.rotation.x = Math.sin(walkTime) * 0.6;
            this.leftLeg.rotation.x = -Math.sin(walkTime) * 0.6;
            this.rightArm.rotation.x = -Math.sin(walkTime) * 0.4;
            this.leftArm.rotation.x = Math.sin(walkTime) * 0.4;
        } else {
            if (this.state === 'moving') {
                this.state = 'idle';
                this.resetPose();
            }
        }
    }

    startAttack(type, audioManager, gamepadManager) {
        this.state = type === 'punch' ? 'punching' : 'kicking';
        this.attackType = type;
        this.stateTimer = type === 'punch' ? 0.25 : 0.38;
        this.hasHit = false;

        if (type === 'punch') {
            audioManager.playPunch();
            gamepadManager.vibrate(100, 0.4, 0.6);
        } else {
            audioManager.playKick();
            gamepadManager.vibrate(160, 0.8, 0.4);
        }
    }

    animateAttack(deltaTime) {
        if (this.attackType === 'punch') {
            const progress = 1 - (this.stateTimer / 0.25);
            if (progress < 0.5) {
                this.rightArm.rotation.x = -Math.PI / 2;
                this.rightArm.position.z = progress * 1.5;
            } else {
                this.rightArm.position.z = (1 - progress) * 1.5;
            }
        } else if (this.attackType === 'kicking') {
            const progress = 1 - (this.stateTimer / 0.38);
            this.rightLeg.rotation.x = -Math.PI / 1.8 * Math.sin(progress * Math.PI);
        }
    }

    poseGuard() {
        this.rightArm.rotation.set(0, 0.8, -0.6);
        this.leftArm.rotation.set(0, -0.8, 0.6);
        this.bodyMesh.position.y = 1.0;
    }

    resetPose() {
        this.rightArm.rotation.set(0, 0, 0);
        this.leftArm.rotation.set(0, 0, 0);
        this.rightArm.position.set(-0.58, 1.3, 0);
        this.leftArm.position.set(0.58, 1.3, 0);
        this.rightLeg.rotation.set(0, 0, 0);
        this.leftLeg.rotation.set(0, 0, 0);
        this.bodyMesh.position.y = 1.2;
    }

    getAttackSphere() {
        if (this.state !== 'punching' && this.state !== 'kicking') return null;

        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const attackPos = this.position.clone().addScaledVector(forward, 1.4);
        attackPos.y += 1.2;

        return new THREE.Sphere(attackPos, this.attackType === 'punch' ? 1.0 : 1.3);
    }

    takeDamage(amount, audioManager, gamepadManager) {
        if (this.state === 'guarding') {
            audioManager.playGuard();
            gamepadManager.vibrate(100, 0.2, 0.8);
            this.hp -= amount * 0.2;
            return;
        }

        this.hp -= amount;
        this.state = 'hit';
        this.stateTimer = 0.3;
        audioManager.playPunch();
        gamepadManager.vibrate(250, 0.9, 0.9);

        if (this.hp < 0) this.hp = 0;
    }
}
