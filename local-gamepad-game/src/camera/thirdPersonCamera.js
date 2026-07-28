import * as THREE from 'three';

/**
 * ThirdPersonCamera - プレイヤー追従・右スティック自由回転対応の三人称カメラ
 */
export class ThirdPersonCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target; // 追従対象 (Player mesh/group)

        this.distance = 6.5; // カメラとプレイヤーの距離
        this.height = 2.2;   // カメラの基準高度
        
        this.pitch = 0.25;   // 上下仰俯角 (Rad)
        this.yaw = 0;        // 左右回転角 (Rad)

        this.minPitch = -0.2;
        this.maxPitch = 1.1;

        this.smoothFactor = 0.12; // 補正追従係数
        this.currentPosition = new THREE.Vector3();
    }

    update(rightStickInput, deltaTime = 0.016) {
        if (!this.target) return;

        // 右スティック入力によるカメラ回転
        const sensitivity = 2.5;
        this.yaw -= rightStickInput.x * sensitivity * deltaTime;
        this.pitch += rightStickInput.y * sensitivity * deltaTime;

        // 仰俯角の制限
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

        // ターゲットの位置
        const targetPos = this.target.position.clone();
        targetPos.y += this.height;

        // Yaw / Pitch から相対オフセット位置を計算
        const offsetX = this.distance * Math.sin(this.yaw) * Math.cos(this.pitch);
        const offsetY = this.distance * Math.sin(this.pitch);
        const offsetZ = this.distance * Math.cos(this.yaw) * Math.cos(this.pitch);

        const idealPosition = new THREE.Vector3(
            targetPos.x + offsetX,
            targetPos.y + offsetY,
            targetPos.z + offsetZ
        );

        // 障害物衝突時のカメラ位置補正 (地面との貫通防止)
        if (idealPosition.y < 0.8) {
            idealPosition.y = 0.8;
        }

        // カメラ位置の滑らかなイージング補間
        this.currentPosition.lerp(idealPosition, this.smoothFactor);
        this.camera.position.copy(this.currentPosition);

        // カメラの注視点
        this.camera.lookAt(targetPos);
    }

    /**
     * カメラの正面（水平ベクトル）を取得。移動入力の方向計算に使用。
     */
    getForwardVector() {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        return forward.normalize();
    }

    /**
     * カメラの右方向（水平ベクトル）を取得。
     */
    getRightVector() {
        const right = new THREE.Vector3();
        const forward = this.getForwardVector();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        return right.normalize();
    }
}
