import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Paper,
  Typography,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

/**
 * 機能リストエディターのProps
 */
interface FeatureListEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
}

/**
 * 機能リストエディターコンポーネント
 * プランの機能リストを編集するためのコンポーネント
 */
const FeatureListEditor: React.FC<FeatureListEditorProps> = ({ features, onChange }) => {
  // 新しい機能のための状態
  const [newFeature, setNewFeature] = useState<string>('');
  const [error, setError] = useState<string>('');

  /**
   * 新しい機能の入力ハンドラ
   */
  const handleNewFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFeature(e.target.value);
    if (error) setError('');
  };

  /**
   * 機能の追加ハンドラ
   */
  const handleAddFeature = () => {
    if (!newFeature.trim()) {
      setError('機能内容を入力してください');
      return;
    }

    if (features.includes(newFeature.trim())) {
      setError('この機能は既に追加されています');
      return;
    }

    const updatedFeatures = [...features, newFeature.trim()];
    onChange(updatedFeatures);
    setNewFeature('');
  };

  /**
   * 機能の削除ハンドラ
   */
  const handleDeleteFeature = (index: number) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    onChange(updatedFeatures);
  };

  /**
   * ドラッグ&ドロップによる並べ替え処理
   */
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(features);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  /**
   * Enterキーで機能を追加
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <Box>
      {/* 新しい機能の追加フォーム */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          label="新しい機能"
          value={newFeature}
          onChange={handleNewFeatureChange}
          onKeyPress={handleKeyPress}
          fullWidth
          size="small"
          error={!!error}
          helperText={error}
          placeholder="例: 無制限のチャット機能"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddFeature}
          startIcon={<AddIcon />}
          sx={{ ml: 1 }}
        >
          追加
        </Button>
      </Box>

      {/* 機能リスト */}
      <Paper
        variant="outlined"
        sx={{ 
          p: 2, 
          minHeight: 100,
          bgcolor: 'background.default'
        }}
      >
        {features.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
            機能が追加されていません。上のフォームから追加してください。
          </Typography>
        ) : (
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="features">
              {(provided) => (
                <List
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  dense
                  disablePadding
                >
                  {features.map((feature, index) => (
                    <Draggable key={index} draggableId={`feature-${index}`} index={index}>
                      {(provided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ 
                            py: 1,
                            borderBottom: index < features.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          {/* ドラッグハンドル */}
                          <Box {...provided.dragHandleProps} sx={{ mr: 1, cursor: 'grab' }}>
                            <DragIndicatorIcon color="action" />
                          </Box>

                          {/* 機能テキスト */}
                          <ListItemText primary={feature} />

                          {/* 削除ボタン */}
                          <IconButton
                            edge="end"
                            aria-label="削除"
                            onClick={() => handleDeleteFeature(index)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Paper>

      {/* 機能数表示 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        機能数: {features.length}
      </Typography>
    </Box>
  );
};

export default FeatureListEditor;