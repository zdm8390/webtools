import * as THREE from 'three';
import { DestructibleObject } from '../entities/destructible.js';

/**
 * CityStage - 3D 街中ステージおよび破壊可能オブジェクトの配置
 */
export class CityStage {
    constructor(scene) {
        this.scene = scene;
        this.destructibles = [];
        this.buildStage();
    }

    buildStage() {
        // --- 1. アスファルト地面 ---
        const groundGeo = new THREE.PlaneGeometry(60, 80);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x181a20,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 白ライン（道路中央線）
        for (let i = -30; i <= 30; i += 6) {
            const stripeGeo = new THREE.PlaneGeometry(0.3, 3);
            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xeeeaad });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(0, 0.01, i);
            this.scene.add(stripe);
        }

        // --- 2. 歩道 (Sidewalks) ---
        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4d, roughness: 0.5 });

        // 左歩道
        const leftWalkGeo = new THREE.BoxGeometry(10, 0.3, 80);
        const leftWalk = new THREE.Mesh(leftWalkGeo, sidewalkMat);
        leftWalk.position.set(-15, 0.15, 0);
        leftWalk.receiveShadow = true;
        this.scene.add(leftWalk);

        // 右歩道
        const rightWalkGeo = new THREE.BoxGeometry(10, 0.3, 80);
        const rightWalk = new THREE.Mesh(rightWalkGeo, sidewalkMat);
        rightWalk.position.set(15, 0.15, 0);
        rightWalk.receiveShadow = true;
        this.scene.add(rightWalk);

        // --- 3. ビル群 (Buildings & Neon Signs) ---
        const buildingColors = [0x1a2238, 0x251e3e, 0x051e3e, 0x2a2a2a];

        // 左右のビル生成
        for (let z = -35; z <= 35; z += 12) {
            // 左側ビル
            this.createBuilding(-25, z, 12, 20 + Math.random() * 15, 10, buildingColors[Math.floor(Math.random() * buildingColors.length)]);
            // 右側ビル
            this.createBuilding(25, z, 12, 20 + Math.random() * 15, 10, buildingColors[Math.floor(Math.random() * buildingColors.length)]);
        }

        // --- 4. 破壊可能オブジェクトの配置 ---
        // 木箱群
        this.destructibles.push(new DestructibleObject(this.scene, 'box', new THREE.Vector3(-8, 0, -6)));
        this.destructibles.push(new DestructibleObject(this.scene, 'box', new THREE.Vector3(-7, 0, -7.2)));
        this.destructibles.push(new DestructibleObject(this.scene, 'box', new THREE.Vector3(7, 0, 5)));

        // 街灯
        this.destructibles.push(new DestructibleObject(this.scene, 'street_light', new THREE.Vector3(-9.5, 0, -15)));
        this.destructibles.push(new DestructibleObject(this.scene, 'street_light', new THREE.Vector3(9.5, 0, -15)));
        this.destructibles.push(new DestructibleObject(this.scene, 'street_light', new THREE.Vector3(-9.5, 0, 15)));
        this.destructibles.push(new DestructibleObject(this.scene, 'street_light', new THREE.Vector3(9.5, 0, 15)));

        // ゴミ箱
        this.destructibles.push(new DestructibleObject(this.scene, 'trash_can', new THREE.Vector3(-9, 0, 2)));
        this.destructibles.push(new DestructibleObject(this.scene, 'trash_can', new THREE.Vector3(9, 0, -10)));

        // 駐車車両
        this.destructibles.push(new DestructibleObject(this.scene, 'car', new THREE.Vector3(-6, 0, 12)));
        this.destructibles.push(new DestructibleObject(this.scene, 'car', new THREE.Vector3(6, 0, -18)));

        // --- 5. ライティング設定 ---
        const ambLight = new THREE.AmbientLight(0x404060, 1.2);
        this.scene.add(ambLight);

        const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);

        // サイバーネオンアンビエント（ピンク・青のポイントライト）
        const cyanLight = new THREE.PointLight(0x00ffff, 3, 25);
        cyanLight.position.set(-12, 4, 0);
        this.scene.add(cyanLight);

        const magentaLight = new THREE.PointLight(0xff00ff, 3, 25);
        magentaLight.position.set(12, 4, -10);
        this.scene.add(magentaLight);
    }

    createBuilding(x, z, width, height, depth, colorHex) {
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.5
        });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // 発光ウィンドウ/ネオンデコレーション
        const windowGeo = new THREE.PlaneGeometry(width - 1, height - 4);
        const windowMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0x00e5ff : 0xff007f,
            transparent: true,
            opacity: 0.15
        });
        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        windowMesh.position.set(x > 0 ? x - width/2 - 0.05 : x + width/2 + 0.05, height / 2, z);
        windowMesh.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(windowMesh);
    }

    update(deltaTime) {
        for (const obj of this.destructibles) {
            obj.update(deltaTime);
        }
    }
}
