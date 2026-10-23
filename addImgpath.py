import json
from pathlib import Path

def add_weapon_icons_correct_dir(json_file_path):
    path = Path(json_file_path)
    if not path.exists():
        print(f"エラー: '{json_file_path}' が見つかりません。")
        return

    # JSONファイルを読み込み
    with open(path, 'r', encoding='utf-8') as f:
        weapons_data = json.load(f)

    count = 0
    for weapon in weapons_data:
        name = weapon.get('name')
        weapon_type = weapon.get('type') # 例: polearm, sword など
        
        if name and weapon_type:
            # images/weapon/武器種/武器名.webp の形式でパスを生成（weapon を単数形に修正）
            weapon['icon'] = f"images/weapon/{weapon_type}/{name}.webp"
            count += 1

    # 変更後のデータを同じJSONファイルに上書き保存
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(weapons_data, f, ensure_ascii=False, indent=4)

    print(f"処理が完了しました！（計 {count} 件の武器に icon を追加しました）")

if __name__ == '__main__':
    # 実際の武器データのファイル名に合わせて変更してください
    add_weapon_icons_correct_dir('data/weapons.json')