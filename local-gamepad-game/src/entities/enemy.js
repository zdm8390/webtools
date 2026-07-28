import * as THREE from 'three';

/**
 * Enemy - 敵キャラクター（3D街中格闘対戦相手 AI）
 */
export class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.copy(position);
        this.scene.add(this.meshGroup);

        this.position = this.meshGroup.position;
        this.rotation = this.meshGroup.rotation;

        this.hp = 80;
        this.maxHp = 80;
        this.state = 'idle'; // 'idle', 'chasing', 'attacking', 'hit', 'down'
        this.stateTimer = 0;
        this.attackCooldown = 0;

        this.moveSpeed = 4.5;
        this.buildMesh();
    }

    buildMesh() {
        // ボディ（レッドの強固な胴体）
        const bodyGeo = new THREE.BoxGeometry(0.9, 1.3, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff2200, roughness: 0.3, metalness: 0.6 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 1.25;
        this.bodyMesh.castShadow = true;
        this.meshGroup.add(this.bodyMesh);

        // ヘッド
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x331111, roughness: 0.2 });
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.set(0, 2.15, 0);
        this.headMesh.castShadow = true;
        this.meshGroup.add(this.headMesh);

        // アイ（赤い目）
        const eyeGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 2.18, 0.26);
        this.meshGroup.add(eye);

        // 腕
        const armGeo = new THREE.BoxGeometry(0.32, 0.85, 0.32);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x220505, metalness: 0.7 });

        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(-0.65, 1.3, 0);
        this.meshGroup.add(this.rightArm);

        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(0.65, 1.3, 0);
        this.meshGroup.add(this.leftArm);
    }

    update(player, deltaTime, audioManager, gamepadManager) {
        if (this.hp <= 0) {
            this.state = 'down';
            this.meshGroup.rotation.x = -Math.PI / 2;
            this.meshGroup.position.y = 0.3;
            return;
        }

        this.stateTimer -= deltaTime;
        this.attackCooldown -= deltaTime;

        if (this.state === 'hit') {
            if (this.stateTimer <= 0) {
                this.state = 'idle';
            }
            return;
        }

        if (this.state === 'attacking') {
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.rightArm.position.z = 0;
            } else {
                this.rightArm.position.z = Math.sin((1 - this.stateTimer / 0.4) * Math.PI) * 1.2;
            }
            return;
        }

        // --- AI 思考 / プレイヤー追跡 ---
        const distToPlayer = this.position.distanceTo(player.position);

        // プレイヤーの方向を向く
        const dir = player.position.clone().sub(this.position);
        dir.y = 0;
        dir.normalize();
        this.rotation.y = Math.atan2(dir.x, dir.z);

        if (distToPlayer < 2.0) {
            // 攻撃範囲内 ➔ 攻撃実行
            if (this.attackCooldown <= 0) {
                this.state = 'attacking';
                this.stateTimer = 0.4;
                this.attackCooldown = 1.8;

                // プレイヤーへのダメージ判定
                if (player.state !== 'dashing') {
                    player.takeDamage(12, audioManager, gamepadManager);
                }
            }
        } else if (distToPlayer < 18.0) {
            // 接近移動
            this.state = 'chasing';
            this.position.addScaledVector(dir, this.moveSpeed * deltaTime);
        }
    }

    takeDamage(amount, impactDir, audioManager, gamepadManager) {
        this.hp -= amount;
        this.state = 'hit';
        this.stateTimer = 0.35;

        // ノックバック効果
        if (impactDir) {
            const kb = impactDir.clone().normalize();
            this.position.addScaledVector(kb, 1.2);
        }

        audioManager.playPunch();
        gamepadManager.vibrate(200, 0.7, 0.8);

        if (this.hp < 0) this.hp = 0;
    }

    getBoundingSphere() {
        return new THREE.Sphere(this.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 1.1);
    }
}
