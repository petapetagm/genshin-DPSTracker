from pathlib import Path

def rename_images(target_dir):
    target_path = Path(target_dir)
    
    # images フォルダが存在するか確認
    if not target_path.exists() or not target_path.is_dir():
        print(f'エラー: "{target_dir}" フォルダが見つかりません。')
        return

    print('images フォルダ内のリネーム処理を開始します...')
    
    count = 0
    # rglob を使ってサブフォルダ内も含めて "_0.webp" で終わるファイルをすべて探す
    for file_path in target_path.rglob('*_0.webp'):
        if file_path.is_file():
            # 新しいファイル名を作成 (_0.webp を .webp に置換)
            new_name = file_path.name.replace('_0.webp', '.webp')
            new_path = file_path.with_name(new_name)
            
            # リネームを実行
            file_path.rename(new_path)
            print(f'変更: {file_path.name} -> {new_name}')
            count += 1

    print(f'すべての処理が完了しました！（計 {count} 件を変更）')

if __name__ == '__main__':
    rename_images('images')