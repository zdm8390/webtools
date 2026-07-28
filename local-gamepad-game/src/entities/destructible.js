import * as THREE from 'three';

/**
 * DestructibleObject - 街中の破壊可能オブジェクト（木箱・街灯・ゴミ箱・車など）
 * 攻撃を受けるとグラフィックが砕け、物理破片が飛散する。
 */
export class DestructibleObject {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type; // 'box', 'street_light', 'trash_can', 'car'
        this.destroyed = false;
        this.position = position.clone();

        this.meshGroup = new THREE.Group();
        this.meshGroup.position.copy(position);
        this.scene.add(this.meshGroup);

        this.hp = 1;
        this.fragments = [];

        this.buildMesh();
    }

    buildMesh() {
        if (this.type === 'box') {
            this.hp = 1;
            const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xcd853f,
                roughness: 0.6,
                metalness: 0.1
            });
            const box = new THREE.Mesh(geo, mat);
            box.position.y = 0.6;
            box.castShadow = true;
            box.receiveShadow = true;
            this.meshGroup.add(box);
            this.mainMesh = box;
        } else if (this.type === 'street_light') {
            this.hp = 2;
            // ポール
            const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.5, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.2 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 2.25;
            pole.castShadow = true;
            this.meshGroup.add(pole);

            // ライト部
            const lightGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
            const lightMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 });
            const lightMesh = new THREE.Mesh(lightGeo, lightMat);
            lightMesh.position.y = 4.4;
            this.meshGroup.add(lightMesh);

            this.mainMesh = pole;
        } else if (this.type === 'trash_can') {
            this.hp = 1;
            const geo = new THREE.CylinderGeometry(0.5, 0.45, 1.1, 12);
            const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.55;
            mesh.castShadow = true;
            this.meshGroup.add(mesh);
            this.mainMesh = mesh;
        } else if (this.type === 'car') {
            this.hp = 4;
            const carBodyGeo = new THREE.BoxGeometry(2.2, 1.0, 4.2);
            const carMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.2, metalness: 0.6 });
            const carBody = new THREE.Mesh(carBodyGeo, carMat);
            carBody.position.y = 0.8;
            carBody.castShadow = true;
            this.meshGroup.add(carBody);

            const cabinGeo = new THREE.BoxGeometry(1.8, 0.8, 2.0);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 });
            const cabin = new THREE.Mesh(cabinGeo, cabinMat);
            cabin.position.set(0, 1.6, -0.2);
            this.meshGroup.add(cabin);

            this.mainMesh = carBody;
        }
    }

    /**
     * 攻撃を受けた時の判定・破片生成
     */
    takeDamage(amount, attackPoint, impactDirection) {
        if (this.destroyed) return false;

        this.hp -= amount;

        // ヒット時の揺れ・閃光
        this.meshGroup.position.x += (Math.random() - 0.5) * 0.2;
        this.meshGroup.position.z += (Math.random() - 0.5) * 0.2;

        if (this.hp <= 0) {
            this.destroy(impactDirection);
            return true;
        }
        return false;
    }

    destroy(impactDirection) {
        if (this.destroyed) return;
        this.destroyed = true;

        // 元のメッシュを非表示
        this.scene.remove(this.meshGroup);

        // 破片 (Fragments) を散らす
        const fragmentCount = this.type === 'car' ? 24 : 12;
        const color = this.type === 'box' ? 0xcd853f : (this.type === 'car' ? 0xff0055 : 0x778899);

        for (let i = 0; i < fragmentCount; i++) {
            const size = 0.2 + Math.random() * 0.35;
            const fragGeo = new THREE.BoxGeometry(size, size, size);
            const fragMat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.5,
                metalness: 0.4
            });
            const frag = new THREE.Mesh(fragGeo, fragMat);

            frag.position.copy(this.meshGroup.position);
            frag.position.y += 0.5 + Math.random();

            // 物理ベクトル
            const dir = impactDirection ? impactDirection.clone() : new THREE.Vector3(0, 1, 0);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 6 + dir.x * 5,
                Math.random() * 6 + 3,
                (Math.random() - 0.5) * 6 + dir.z * 5
            );

            const rotSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );

            this.scene.add(frag);
            this.fragments.push({ mesh: frag, velocity: velocity, rotSpeed: rotSpeed, life: 1.8 });
        }
    }

    update(deltaTime) {
        // 破片の物理挙動アニメーション更新
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            f.life -= deltaTime;

            if (f.life <= 0) {
                this.scene.remove(f.mesh);
                this.fragments.splice(i, 1);
                continue;
            }

            // 重力
            f.velocity.y -= 16 * deltaTime;
            f.mesh.position.addScaledVector(f.velocity, deltaTime);

            // 地面バウンド
            if (f.mesh.position.y < 0.15) {
                f.mesh.position.y = 0.15;
                f.velocity.y = -f.velocity.y * 0.4;
                f.velocity.x *= 0.7;
                f.velocity.z *= 0.7;
            }

            f.mesh.rotation.x += f.rotSpeed.x * deltaTime;
            f.mesh.rotation.y += f.rotSpeed.y * deltaTime;
            f.mesh.rotation.z += f.rotSpeed.z * deltaTime;

            // フェードアウト
            if (f.mesh.material) {
                f.mesh.material.transparent = true;
                f.mesh.material.opacity = Math.max(0, f.life / 1.8);
            }
        }
    }

    getBoundingSphere() {
        return new THREE.Sphere(this.meshGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 1.2);
    }
}
