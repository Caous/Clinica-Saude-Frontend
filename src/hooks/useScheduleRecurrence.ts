/**
 * useScheduleRecurrence - Hook para gerenciar recorrência de agendamentos
 * 
 * Extrai lógica de cálculo de datas recorrentes e criação de agendamentos
 * 
 * Responsabilidades:
 * - Calcular datas com base em dias da semana
 * - Validar horários
 * - Criar agendamentos recorrentes
 * - Gerenciar estado de recorrência
 */

import { useState, useCallback, useMemo } from 'react';
import { LoggerService } from '../services/util/LoggerService';
import {
  calculateRecurrenceDates,
  getDefaultStartFrom,
  type RecurrenceType,
} from '../utils/scheduleRecurrence';

interface RecurrenceConfig {
  enabled: boolean;
  selectedDays: string[];
  selectedTime: string;
  numberOfSessions: number;
  /** Data-base "A partir de" (inclusive). Padrão: dia seguinte ao atual. */
  startFrom: Date;
  /** Tipo de recorrência (semanal/quinzenal/mensal). Padrão: semanal. */
  recurrenceType: RecurrenceType;
  employeeId?: string;
  branchId?: string;
}

interface CalculatedSchedule {
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
  dayOfWeek: string;
  timeString: string;
}

const DAY_MAP: Record<string, number> = {
  'Segunda-Feira': 1,
  'Terça-Feira': 2,
  'Quarta-Feira': 3,
  'Quinta-Feira': 4,
  'Sexta-Feira': 5,
  'Sábado': 6,
  'Domingo': 0,
};

const REVERSE_DAY_MAP: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-Feira',
  2: 'Terça-Feira',
  3: 'Quarta-Feira',
  4: 'Quinta-Feira',
  5: 'Sexta-Feira',
  6: 'Sábado',
};

export function useScheduleRecurrence(initialConfig: Partial<RecurrenceConfig> = {}) {
  const [config, setConfig] = useState<RecurrenceConfig>({
    enabled: false,
    selectedDays: [],
    selectedTime: '',
    numberOfSessions: 1,
    startFrom: getDefaultStartFrom(),
    recurrenceType: 'semanal',
    ...initialConfig,
  });

  /**
   * Calcular próximas datas com base em dias da semana
   */
  const calculateNextDates = useCallback(
    (
      daysOfWeek: string[],
      count: number,
      fromTime?: string,
      startFrom?: Date,
      recurrenceType: RecurrenceType = 'semanal'
    ): CalculatedSchedule[] => {
      try {
        // Núcleo puro: datas-base da recorrência a partir de "startFrom".
        const dates = calculateRecurrenceDates({
          daysOfWeek,
          count,
          startFrom: startFrom ?? getDefaultStartFrom(),
          recurrenceType,
          time: fromTime,
        });

        const schedules: CalculatedSchedule[] = dates.map((currentDate) => {
          const startDateTime = new Date(currentDate);
          if (fromTime) {
            const [hours, minutes] = fromTime.split(':').map(Number);
            startDateTime.setHours(hours, minutes, 0, 0);
          } else {
            startDateTime.setHours(9, 0, 0, 0); // Horário padrão 9:00
          }

          const endDateTime = new Date(startDateTime);
          endDateTime.setHours(endDateTime.getHours() + 1); // 1 hora de duração

          return {
            date: new Date(currentDate),
            startDateTime,
            endDateTime,
            dayOfWeek: REVERSE_DAY_MAP[currentDate.getDay()],
            timeString: fromTime || '09:00',
          };
        });

        if (schedules.length < count) {
          LoggerService.warn(
            'useScheduleRecurrence',
            `Only created ${schedules.length} of ${count} requested sessions`
          );
        }

        return schedules;
      } catch (error) {
        LoggerService.error(
          'useScheduleRecurrence',
          'Error calculating next dates',
          error
        );
        return [];
      }
    },
    []
  );

  /**
   * Calcular datas com a configuração atual
   */
  const calculatedSchedules = useMemo(() => {
    if (!config.enabled || config.selectedDays.length === 0) {
      return [];
    }

    return calculateNextDates(
      config.selectedDays,
      config.numberOfSessions,
      config.selectedTime,
      config.startFrom,
      config.recurrenceType
    );
  }, [
    config.enabled,
    config.selectedDays,
    config.numberOfSessions,
    config.selectedTime,
    config.startFrom,
    config.recurrenceType,
    calculateNextDates,
  ]);

  /**
   * Atualizar dias selecionados
   */
  const updateSelectedDays = useCallback((days: string[]) => {
    setConfig((prev) => ({
      ...prev,
      selectedDays: days,
    }));
  }, []);

  /**
   * Atualizar horário selecionado
   */
  const updateSelectedTime = useCallback((time: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedTime: time,
    }));
  }, []);

  /**
   * Atualizar data-base "A partir de"
   */
  const updateStartFrom = useCallback((startFrom: Date) => {
    setConfig((prev) => ({
      ...prev,
      startFrom,
    }));
  }, []);

  /**
   * Atualizar tipo de recorrência
   */
  const updateRecurrenceType = useCallback((recurrenceType: RecurrenceType) => {
    setConfig((prev) => ({
      ...prev,
      recurrenceType,
    }));
  }, []);

  /**
   * Atualizar número de sessões
   */
  const updateNumberOfSessions = useCallback((count: number) => {
    setConfig((prev) => ({
      ...prev,
      numberOfSessions: Math.max(1, count),
    }));
  }, []);

  /**
   * Atualizar ID do funcionário
   */
  const updateEmployeeId = useCallback((employeeId: string) => {
    setConfig((prev) => ({
      ...prev,
      employeeId,
    }));
  }, []);

  /**
   * Atualizar ID da filial
   */
  const updateBranchId = useCallback((branchId: string) => {
    setConfig((prev) => ({
      ...prev,
      branchId,
    }));
  }, []);

  /**
   * Ativar/desativar recorrência
   */
  const toggleRecurrence = useCallback((enabled?: boolean) => {
    setConfig((prev) => ({
      ...prev,
      enabled: enabled !== undefined ? enabled : !prev.enabled,
    }));
  }, []);

  /**
   * Resetar configuração
   */
  const reset = useCallback(() => {
    setConfig({
      enabled: false,
      selectedDays: [],
      selectedTime: '',
      numberOfSessions: 1,
      startFrom: getDefaultStartFrom(),
      recurrenceType: 'semanal',
    });
  }, []);

  /**
   * Validar configuração
   */
  const isValid = useCallback((): boolean => {
    if (!config.enabled) {
      return true;
    }

    return (
      config.selectedDays.length > 0 &&
      config.selectedTime.length > 0 &&
      config.numberOfSessions > 0 &&
      (config.employeeId?.length ?? 0) > 0
    );
  }, [config]);

  /**
   * Obter resumo em texto
   */
  const summary = useMemo(() => {
    if (!config.enabled) {
      return 'Sem recorrência';
    }

    const days = config.selectedDays.join(', ');
    return `${config.numberOfSessions} sessões às ${config.selectedTime} nos dias: ${days}`;
  }, [config.enabled, config.selectedDays, config.numberOfSessions, config.selectedTime]);

  return {
    // Configuração
    config,
    
    // Atualizar configuração
    updateSelectedDays,
    updateSelectedTime,
    updateStartFrom,
    updateRecurrenceType,
    updateNumberOfSessions,
    updateEmployeeId,
    updateBranchId,
    toggleRecurrence,
    reset,

    // Dados calculados
    calculatedSchedules,

    // Validação e resumo
    isValid,
    summary,

    // Funções utilitárias
    calculateNextDates,
    dayMap: DAY_MAP,
  };
}

export default useScheduleRecurrence;
