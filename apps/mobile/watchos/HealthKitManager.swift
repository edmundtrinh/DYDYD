// ============================================
// DYDYD Watch - HealthKit Manager
// ============================================
// Manages HealthKit data access on the Watch for
// auto-completing health-related quests

import Foundation
import HealthKit

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()
    // Note: Apple's HealthKit does not reveal whether the user granted or denied
    // individual type authorization, to protect user privacy. This flag only tracks
    // whether the authorization dialog was presented without error. Actual data
    // availability is checked when querying.
    @Published var authorizationRequested: Bool = false

    private let readTypes: Set<HKSampleType> = {
        var types = Set<HKSampleType>()
        if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepType)
        }
        if let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(energyType)
        }
        if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepType)
        }
        if let mindfulType = HKCategoryType.categoryType(forIdentifier: .mindfulSession) {
            types.insert(mindfulType)
        }
        if let workoutType = HKWorkoutType.workoutType() as? HKSampleType {
            types.insert(workoutType)
        }
        return types
    }()

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        try await healthStore.requestAuthorization(toShare: [], read: readTypes)

        await MainActor.run {
            // success=true means the dialog was shown, not that access was granted.
            self.authorizationRequested = true
        }

        setupBackgroundDelivery()
    }

    private func setupBackgroundDelivery() {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }

        healthStore.enableBackgroundDelivery(for: stepType, frequency: .hourly) { _, error in
            if let error = error {
                print("DYDYD Watch: Background delivery setup failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Data Queries

    func getTodaySteps() async throws -> Double {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return 0 }
        return try await queryTodaySum(for: stepType, unit: .count())
    }

    func getTodayActiveCalories() async throws -> Double {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else { return 0 }
        return try await queryTodaySum(for: energyType, unit: .kilocalorie())
    }

    func getTodayMindfulMinutes() async throws -> Double {
        guard let mindfulType = HKCategoryType.categoryType(forIdentifier: .mindfulSession) else { return 0 }
        return try await queryTodayDuration(for: mindfulType)
    }

    private func queryTodaySum(for quantityType: HKQuantityType, unit: HKUnit) async throws -> Double {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let value = result?.sumQuantity()?.doubleValue(for: unit) ?? 0
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    private func queryTodayDuration(for categoryType: HKCategoryType) async throws -> Double {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: categoryType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let totalSeconds = samples?.reduce(0.0) { total, sample in
                    total + sample.endDate.timeIntervalSince(sample.startDate)
                } ?? 0

                continuation.resume(returning: totalSeconds / 60.0)
            }

            healthStore.execute(query)
        }
    }
}
