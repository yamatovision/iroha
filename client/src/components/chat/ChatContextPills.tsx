import React from 'react';
import { Box, Chip, styled } from '@mui/material';
import { ContextType, IContextItem } from '../../../../shared';

// スタイル設定
const PillsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(0.5, 1),
  background: 'white',
  overflowX: 'auto',
  borderBottom: '1px solid #f0f0f0',
  '&::-webkit-scrollbar': {
    display: 'none'
  },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
}));

const ContextPill = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  fontWeight: 500,
  '& .MuiChip-deleteIcon': {
    fontSize: '16px'
  },
}));

// コンポーネントのプロパティ
interface ChatContextPillsProps {
  activeContexts: IContextItem[];
  onRemoveContext: (contextId: string) => void;
}

const ChatContextPills: React.FC<ChatContextPillsProps> = ({
  activeContexts,
  onRemoveContext
}) => {
  // コンテキストタイプに基づいて色を取得
  const getColorByType = (type: ContextType): string => {
    switch (type) {
      case ContextType.SELF:
        return '#9c27b0'; // 紫色
      case ContextType.FRIEND:
        return '#2196f3'; // 青色
      case ContextType.FORTUNE:
        return '#ff9800'; // オレンジ色
      case ContextType.TEAM:
        return '#4caf50'; // 緑色
      case ContextType.TEAM_GOAL:
        return '#009688'; // ティール色
      default:
        return '#9e9e9e'; // グレー
    }
  };

  // 空の場合は何も表示しない
  if (activeContexts.length === 0) {
    return null;
  }

  return (
    <PillsContainer>
      {activeContexts.map((context) => (
        <ContextPill
          key={`${context.type}-${context.id}`}
          icon={<span className="material-icons">{context.iconType}</span>}
          label={context.name}
          variant="outlined"
          color="primary"
          onDelete={context.removable ? () => onRemoveContext(context.id) : undefined}
          sx={{
            borderColor: getColorByType(context.type),
            color: getColorByType(context.type),
            '& .MuiChip-icon': {
              color: getColorByType(context.type),
            },
            '&.MuiChip-outlined': {
              borderColor: `${getColorByType(context.type)}50`,
            },
          }}
        />
      ))}
    </PillsContainer>
  );
};

export default ChatContextPills;